"""Standalone pipeline manager for WildSpotter.

Runs terrain workers in parallel and the post-terrain pipeline
(legal -> AI -> scoring) in a loop alongside them.

Usage:
    docker-compose exec worker python run_all.py --terrain-workers 4
    docker-compose exec worker python run_all.py --batch-size 200 --no-terrain
"""

import argparse
import signal
import sys
import threading
import time
from typing import List

from utils import get_db_connection, setup_logging

logger = setup_logging("run_all")

# Graceful shutdown flag
shutdown = threading.Event()


def handle_signal(signum: int, frame: object) -> None:
    logger.info("Received signal %d, shutting down gracefully...", signum)
    shutdown.set()


signal.signal(signal.SIGINT, handle_signal)
signal.signal(signal.SIGTERM, handle_signal)


# ---------------------------------------------------------------------------
# Status helpers
# ---------------------------------------------------------------------------

ALL_STATUSES = ("pending", "terrain_done", "legal_done", "ai_done", "context_done", "completed")


def get_status_counts() -> dict[str, int]:
    """Return a dict of status -> count for the spots table."""
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT status, count(*)
                FROM spots
                GROUP BY status
                """
            )
            return {row[0]: row[1] for row in cur.fetchall()}
    finally:
        conn.close()


def format_progress(counts: dict[str, int]) -> str:
    parts: List[str] = []
    for s in ALL_STATUSES:
        c = counts.get(s, 0)
        if c > 0:
            parts.append(f"{s}={c}")
    total = sum(counts.values())
    return f"[total={total}] " + " | ".join(parts) if parts else "No spots in database"


# ---------------------------------------------------------------------------
# Terrain worker loop
# ---------------------------------------------------------------------------

def terrain_worker_loop(worker_id: int, batch_size: int) -> None:
    """Run terrain processing in a loop until shutdown or no work left."""
    import terrain

    idle = 0
    max_idle = 5

    while not shutdown.is_set() and idle < max_idle:
        try:
            processed = terrain.process_batch(batch_size=batch_size, limit=batch_size)
        except Exception:
            logger.exception("Terrain worker %d error", worker_id)
            shutdown.wait(10)
            continue

        if processed == 0:
            idle += 1
            shutdown.wait(15)
        else:
            idle = 0
            logger.info("Terrain worker %d processed %d spots", worker_id, processed)

    logger.info("Terrain worker %d exiting (idle=%d)", worker_id, idle)


# ---------------------------------------------------------------------------
# Pipeline loop (legal -> AI -> scoring)
# ---------------------------------------------------------------------------

def pipeline_loop(batch_size: int) -> None:
    """Run the post-terrain pipeline stages in order, looping until shutdown."""
    import legal
    import ai_inference
    import context_scoring
    import scoring

    idle = 0
    max_idle = 10  # more patience since terrain feeds us

    while not shutdown.is_set() and idle < max_idle:
        work_done = 0

        try:
            processed = legal.process_batch(batch_size=min(batch_size, 50))
            work_done += processed
            if processed > 0:
                logger.info("Legal: processed %d spots", processed)
        except Exception:
            logger.exception("Legal stage error")

        if shutdown.is_set():
            break

        try:
            processed = ai_inference.process_batch(batch_size=min(batch_size, 100))
            work_done += processed
            if processed > 0:
                logger.info("AI inference: processed %d spots", processed)
        except Exception:
            logger.exception("AI inference stage error")

        if shutdown.is_set():
            break

        try:
            processed = context_scoring.process_batch(batch_size=min(batch_size, 100))
            work_done += processed
            if processed > 0:
                logger.info("Context scoring: processed %d spots", processed)
        except Exception:
            logger.exception("Context scoring stage error")

        if shutdown.is_set():
            break

        try:
            processed = scoring.process_batch(batch_size=batch_size)
            work_done += processed
            if processed > 0:
                logger.info("Final scoring: processed %d spots", processed)
        except Exception:
            logger.exception("Scoring stage error")

        if work_done == 0:
            idle += 1
            shutdown.wait(10)
        else:
            idle = 0

    logger.info("Pipeline loop exiting (idle=%d)", idle)


# ---------------------------------------------------------------------------
# Progress reporter
# ---------------------------------------------------------------------------

def progress_reporter(interval_seconds: int = 30) -> None:
    """Print status counts every N seconds until shutdown."""
    while not shutdown.is_set():
        shutdown.wait(interval_seconds)
        if shutdown.is_set():
            break
        try:
            counts = get_status_counts()
            logger.info("Progress: %s", format_progress(counts))
        except Exception:
            logger.exception("Failed to read progress")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(description="WildSpotter pipeline manager")
    parser.add_argument(
        "--terrain-workers", type=int, default=4,
        help="Number of parallel terrain workers (default: 4)",
    )
    parser.add_argument(
        "--batch-size", type=int, default=500,
        help="Batch size per worker iteration (default: 500)",
    )
    parser.add_argument(
        "--no-terrain", action="store_true",
        help="Skip terrain processing, only run legal/AI/scoring pipeline",
    )
    args = parser.parse_args()

    # Print initial status
    try:
        counts = get_status_counts()
        logger.info("Starting pipeline. Current state: %s", format_progress(counts))
    except Exception:
        logger.warning("Could not read initial status (DB may be empty)")

    threads: List[threading.Thread] = []

    # Progress reporter thread
    reporter = threading.Thread(target=progress_reporter, args=(30,), daemon=True)
    reporter.start()

    # Terrain workers
    if not args.no_terrain:
        per_worker_batch = max(1, args.batch_size // args.terrain_workers)
        for i in range(args.terrain_workers):
            t = threading.Thread(
                target=terrain_worker_loop,
                args=(i, per_worker_batch),
                name=f"terrain-{i}",
            )
            t.start()
            threads.append(t)
            logger.info(
                "Started terrain worker %d (batch_size=%d)", i, per_worker_batch,
            )

    # Pipeline thread
    pipeline_thread = threading.Thread(
        target=pipeline_loop, args=(args.batch_size,), name="pipeline",
    )
    pipeline_thread.start()
    threads.append(pipeline_thread)
    logger.info("Started pipeline loop (legal -> AI -> context -> scoring)")

    # Wait for all threads
    try:
        while any(t.is_alive() for t in threads):
            for t in threads:
                t.join(timeout=1.0)
    except KeyboardInterrupt:
        logger.info("KeyboardInterrupt received, shutting down...")
        shutdown.set()
        for t in threads:
            t.join(timeout=30)

    # Final summary
    try:
        counts = get_status_counts()
        logger.info("Final state: %s", format_progress(counts))
    except Exception:
        pass

    logger.info("All workers stopped. Exiting.")


if __name__ == "__main__":
    main()

"""Run the full post-terrain pipeline in a loop.

Waits for terrain_done spots and pushes them through:
    legal → AI → context scoring → final scoring.
Exits when no work remains after a few idle cycles.
"""

import time
import logging
from utils import get_db_connection, setup_logging

logger = setup_logging("pipeline")


def count_by_status(conn, status: str) -> int:
    with conn.cursor() as cur:
        cur.execute("SELECT count(*) FROM spots WHERE status = %s", (status,))
        return cur.fetchone()[0]


def run_worker(module_name: str, batch_size: int = 100) -> int:
    """Import and run a worker module's process_batch. Returns count processed."""
    import importlib
    mod = importlib.import_module(module_name)
    return mod.process_batch(batch_size=batch_size)


def main() -> None:
    idle_count = 0
    max_idle = 3

    while idle_count < max_idle:
        conn = get_db_connection()
        terrain_done = count_by_status(conn, "terrain_done")
        legal_done = count_by_status(conn, "legal_done")
        ai_done = count_by_status(conn, "ai_done")
        context_done = count_by_status(conn, "context_done")
        conn.close()

        total_work = terrain_done + legal_done + ai_done + context_done
        if total_work == 0:
            idle_count += 1
            logger.info("No work available (idle %d/%d). Waiting 30s...", idle_count, max_idle)
            time.sleep(30)
            continue

        idle_count = 0

        if terrain_done > 0:
            logger.info("Processing %d terrain_done spots through legal...", terrain_done)
            run_worker("legal", batch_size=50)

        # Re-check legal_done after legal run
        conn_mid = get_db_connection()
        legal_done = count_by_status(conn_mid, "legal_done")
        conn_mid.close()

        if legal_done > 0:
            logger.info("Processing %d legal_done spots through AI...", legal_done)
            run_worker("ai_inference", batch_size=100)

        # Context scoring (new stage)
        conn2 = get_db_connection()
        ai_done = count_by_status(conn2, "ai_done")
        conn2.close()
        if ai_done > 0:
            logger.info("Context-scoring %d ai_done spots...", ai_done)
            run_worker("context_scoring", batch_size=100)

        # Final composite scoring
        conn3 = get_db_connection()
        context_ready = count_by_status(conn3, "context_done")
        conn3.close()
        if context_ready > 0:
            logger.info("Final scoring %d context_done spots...", context_ready)
            run_worker("scoring", batch_size=200)

        # Log summary
        conn4 = get_db_connection()
        completed = count_by_status(conn4, "completed")
        pending = count_by_status(conn4, "pending")
        conn4.close()
        logger.info(
            "Pipeline status: %d completed, %d pending",
            completed, pending,
        )

    logger.info("Pipeline idle for %d cycles. Exiting.", max_idle)


if __name__ == "__main__":
    main()

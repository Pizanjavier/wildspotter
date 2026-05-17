"""Worker HTTP API for n8n integration and manual triggering.

Endpoints:
    GET  /status          — Pipeline status counts
    POST /run/terrain     — Run a terrain batch
    POST /run/pipeline    — Run one pipeline pass (legal → AI → scoring)
    POST /run/all         — Run terrain + pipeline (blocking)

Usage:
    python api.py                    # Start on port 8001
    python api.py --port 9000        # Custom port
"""

import argparse
import json
import logging
import os
import threading
from typing import Any

from flask import Flask, jsonify, request

from utils import get_db_connection, setup_logging

logger = setup_logging("worker-api")
app = Flask(__name__)

# Track running jobs
_running_lock = threading.Lock()
_running_jobs: dict[str, bool] = {}


def get_status() -> dict[str, int]:
    """Get spot counts by status."""
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT status, COUNT(*) FROM spots GROUP BY status ORDER BY status"
            )
            return {row[0]: row[1] for row in cur.fetchall()}
    finally:
        conn.close()


def get_progress() -> dict[str, Any]:
    """Get detailed pipeline progress with ETA."""
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT status, COUNT(*) FROM spots GROUP BY status ORDER BY status")
            counts = {row[0]: row[1] for row in cur.fetchall()}

            total = sum(counts.values())
            completed = counts.get("completed", 0)
            pct = (completed / total * 100) if total > 0 else 0

            # Recent processing rate (last 60 min)
            cur.execute("""
                SELECT COUNT(*) FROM spots
                WHERE status = 'completed'
                  AND updated_at > NOW() - INTERVAL '60 minutes'
            """)
            rate_per_hour = cur.fetchone()[0]

            remaining = total - completed
            eta_hours = remaining / rate_per_hour if rate_per_hour > 0 else None

            # Score distribution for completed spots
            cur.execute("""
                SELECT
                    COUNT(*) FILTER (WHERE composite_score >= 80) AS high,
                    COUNT(*) FILTER (WHERE composite_score >= 60 AND composite_score < 80) AS medium,
                    COUNT(*) FILTER (WHERE composite_score < 60) AS low
                FROM spots WHERE status = 'completed'
            """)
            row = cur.fetchone()
            score_dist = {"high_80plus": row[0], "medium_60_79": row[1], "low_under_60": row[2]}

            # Recent completions (last 5)
            cur.execute("""
                SELECT id, composite_score, updated_at
                FROM spots
                WHERE status = 'completed'
                ORDER BY updated_at DESC
                LIMIT 5
            """)
            recent_completed = [
                {"id": r[0], "score": r[1], "time": r[2].isoformat() if r[2] else ""}
                for r in cur.fetchall()
            ]

            # Total processed by each stage
            cur.execute("""
                SELECT
                    COUNT(*) FILTER (WHERE terrain_score IS NOT NULL) AS terrain,
                    COUNT(*) FILTER (WHERE legal_status IS NOT NULL) AS legal,
                    COUNT(*) FILTER (WHERE ai_score IS NOT NULL) AS ai,
                    COUNT(*) FILTER (WHERE context_score IS NOT NULL) AS context,
                    COUNT(*) FILTER (WHERE context_details->'dog_friendly' IS NOT NULL) AS amenities
                FROM spots
            """)
            stage_row = cur.fetchone()
            total_dones = {
                "terrain_done": stage_row[0],
                "legal_done": stage_row[1],
                "ai_done": stage_row[2],
                "context_done": stage_row[3],
                "amenities_done": stage_row[4],
                "completed": completed
            }

            # Vision labeler stats
            cur.execute("""
                SELECT
                    COUNT(*) FILTER (WHERE ai_details IS NOT NULL) AS analyzed,
                    COUNT(*) FILTER (
                        WHERE status IN ('ai_done', 'context_done', 'completed')
                          AND satellite_image_path IS NOT NULL
                          AND ai_details IS NULL
                    ) AS remaining
                FROM spots
            """)
            vision_row = cur.fetchone()
            vision_analyzed = vision_row[0]
            vision_remaining = vision_row[1]
            vision_total = vision_analyzed + vision_remaining

            cur.execute("""
                SELECT COUNT(*) FROM spots
                WHERE ai_details IS NOT NULL
                  AND updated_at > NOW() - INTERVAL '60 minutes'
            """)
            vision_rate = cur.fetchone()[0]

            # Recent vision completions (last 5) with sub-score breakdown
            cur.execute("""
                SELECT osm_id, ai_score, ai_details, updated_at
                FROM spots
                WHERE ai_details IS NOT NULL
                ORDER BY updated_at DESC
                LIMIT 5
            """)
            recent_vision = [
                {
                    "osm_id": r[0],
                    "ai_score": r[1],
                    "details": r[2],
                    "time": r[3].isoformat() if r[3] else "",
                }
                for r in cur.fetchall()
            ]

            vision_stats = {
                "analyzed": vision_analyzed,
                "remaining": vision_remaining,
                "total_eligible": vision_total,
                "pct": round(vision_analyzed / vision_total * 100, 1) if vision_total > 0 else 0,
                "cost_usd": round(vision_analyzed * 0.001, 2),
                "rate_per_hour": vision_rate,
                "eta_hours": round(vision_remaining / vision_rate, 1) if vision_rate > 0 else None,
                "recent": recent_vision,
            }

            return {
                "total_spots": total,
                "completed": completed,
                "progress_pct": round(pct, 1),
                "pipeline": counts,
                "total_dones": total_dones,
                "rate_per_hour": rate_per_hour,
                "eta_hours": round(eta_hours, 1) if eta_hours else None,
                "score_distribution": score_dist,
                "recent_completed": recent_completed,
                "vision": vision_stats,
            }
    finally:
        conn.close()


def run_terrain_batch(batch_size: int, limit: int) -> int:
    """Run one terrain batch. Returns count processed."""
    from pipeline import terrain
    return terrain.process_batch(batch_size=batch_size, limit=limit)


def run_pipeline_pass(
    legal_batch: int = 200,
    ai_batch: int = 100,
    context_batch: int = 100,
    scoring_batch: int = 500,
) -> dict[str, int]:
    """Run one pass of legal → AI → context → scoring. Returns counts per stage."""
    results: dict[str, int] = {}
    try:
        from pipeline import legal
        results["legal"] = legal.process_batch(batch_size=legal_batch)
    except Exception as e:
        logger.error("Legal failed: %s", e)
        results["legal"] = 0

    try:
        from pipeline import ai_inference
        results["ai"] = ai_inference.process_batch(batch_size=ai_batch)
    except Exception as e:
        logger.error("AI failed: %s", e)
        results["ai"] = 0

    try:
        from pipeline import context_scoring
        results["context"] = context_scoring.process_batch(batch_size=context_batch)
    except Exception as e:
        logger.error("Context scoring failed: %s", e)
        results["context"] = 0

    try:
        from pipeline import amenities_scoring
        results["amenities"] = amenities_scoring.process_batch(batch_size=scoring_batch)
    except Exception as e:
        logger.error("Amenities scoring failed: %s", e)
        results["amenities"] = 0

    try:
        from pipeline import scoring
        results["scoring"] = scoring.process_batch(batch_size=scoring_batch)
    except Exception as e:
        logger.error("Scoring failed: %s", e)
        results["scoring"] = 0

    return results


def run_parallel_pass(
    terrain_batch: int = 500,
    terrain_limit: int = 500,
    legal_batch: int = 100,
    ai_batch: int = 100,
    context_batch: int = 500,
    amenities_batch: int = 500,
    scoring_batch: int = 500,
) -> dict[str, Any]:
    """Run terrain, legal, and AI in parallel threads, then scoring."""
    import concurrent.futures

    results: dict[str, Any] = {}

    def _terrain():
        try:
            from pipeline import terrain
            return terrain.process_batch(batch_size=terrain_batch, limit=terrain_limit)
        except Exception as e:
            logger.error("Terrain failed: %s", e)
            return 0

    def _legal():
        try:
            from pipeline import legal
            return legal.process_batch(batch_size=legal_batch)
        except Exception as e:
            logger.error("Legal failed: %s", e)
            return 0

    def _ai():
        try:
            from pipeline import ai_inference
            return ai_inference.process_batch(batch_size=ai_batch)
        except Exception as e:
            logger.error("AI failed: %s", e)
            return 0

    # Run terrain, legal, AI in parallel
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
        ft = executor.submit(_terrain)
        fl = executor.submit(_legal)
        fa = executor.submit(_ai)
        results["terrain"] = ft.result()
        results["legal"] = fl.result()
        results["ai"] = fa.result()

    # Context scoring runs after the parallel stage
    try:
        from pipeline import context_scoring
        results["context"] = context_scoring.process_batch(batch_size=context_batch)
    except Exception as e:
        logger.error("Context scoring failed: %s", e)
        results["context"] = 0

    # Amenities scoring
    try:
        from pipeline import amenities_scoring
        results["amenities"] = amenities_scoring.process_batch(batch_size=amenities_batch)
    except Exception as e:
        logger.error("Amenities scoring failed: %s", e)
        results["amenities"] = 0

    # Final scoring runs last
    try:
        from pipeline import scoring
        results["scoring"] = scoring.process_batch(batch_size=scoring_batch)
    except Exception as e:
        logger.error("Scoring failed: %s", e)
        results["scoring"] = 0

    return results


@app.route("/status", methods=["GET"])
def status_endpoint() -> Any:
    """Return pipeline status counts."""
    counts = get_status()
    with _running_lock:
        jobs = dict(_running_jobs)
    return jsonify({"status": counts, "running_jobs": jobs})


@app.route("/progress", methods=["GET"])
def progress_endpoint() -> Any:
    """Return detailed progress with ETA."""
    return jsonify(get_progress())


@app.route("/dashboard", methods=["GET"])
def dashboard_endpoint() -> Any:
    """Serve a live HTML progress dashboard."""
    html = """<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>WildSpotter Pipeline</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#0A0F1C;color:#E2E8F0;font-family:'JetBrains Mono',monospace;padding:32px}
h1{color:#22D3EE;font-size:24px;margin-bottom:24px;letter-spacing:2px}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;margin-bottom:24px}
.card{background:#1E293B;border-radius:12px;padding:20px}
.card .label{font-size:11px;color:#94A3B8;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px}
.card .value{font-size:28px;font-weight:bold}
.cyan{color:#22D3EE} .green{color:#4ADE80} .amber{color:#FBBF24} .red{color:#EF4444}
.bar-bg{background:#334155;border-radius:8px;height:24px;margin:16px 0;overflow:hidden;display:flex}
.bar-fill{height:100%;background:linear-gradient(90deg,#22D3EE,#4ADE80);border-radius:8px;transition:width 1s}
.pipeline{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:24px}
.stage{background:#1E293B;border-radius:8px;padding:12px 16px;flex:1;min-width:120px;text-align:center}
.stage .name{font-size:10px;color:#94A3B8;text-transform:uppercase;letter-spacing:1px}
.stage .count{font-size:22px;font-weight:bold;color:#22D3EE;margin-top:4px}
.footer{color:#475569;font-size:11px;margin-top:24px}
#updated{color:#64748B}
@keyframes pulse { 0% { opacity:1; box-shadow:0 0 0 0 rgba(74,222,128,0.4); } 70% { opacity:0.8; box-shadow:0 0 0 6px rgba(74,222,128,0); } 100% { opacity:1; box-shadow:0 0 0 0 rgba(74,222,128,0); } }
.active-badge { background:rgba(74,222,128,0.2); color:#4ADE80; animation: pulse 2s infinite; border: 1px solid rgba(74,222,128,0.5); }
.idle-badge { background:#1E293B; color:#64748B; border: 1px solid #334155; }
.ticker { background:#1E293B; border-radius:8px; padding:12px 16px; font-size:12px; font-family:monospace; line-height:1.6; color:#94A3B8; min-height:100px; margin-bottom: 24px;}
</style></head><body>
<h1 style="display:flex;align-items:center;">
  WILDSPOTTER PIPELINE
  <div id="status-badge" class="idle-badge" style="margin-left:auto;font-size:12px;padding:4px 12px;border-radius:12px;letter-spacing:1px;text-transform:uppercase;">
    ⏸️ Idle
  </div>
</h1>
<div class="grid">
  <div class="card"><div class="label">Completed</div><div class="value green" id="completed">-</div></div>
  <div class="card"><div class="label">Unstarted (Pending)</div><div class="value cyan" id="pending">-</div></div>
  <div class="card"><div class="label">Total Spots</div><div class="value" id="total">-</div></div>
  <div class="card"><div class="label">Rate</div><div class="value" id="rate">-</div></div>
  <div class="card"><div class="label">ETA</div><div class="value amber" id="eta">-</div></div>
</div>
<div style="font-size:16px; text-align:center; font-weight:bold; margin-bottom:8px; color:#4ADE80" id="pctText">0% Fully Completed</div>
<div class="bar-bg">
  <div id="bar-completed" style="background:#4ADE80;width:0%;transition:width 1s;" title="Completed"></div>
  <div id="bar-amenities" style="background:#EC4899;width:0%;transition:width 1s;" title="Amenities Done (Wait: Scoring)"></div>
  <div id="bar-context" style="background:#B794F4;width:0%;transition:width 1s;" title="Context Done (Wait: Amenities)"></div>
  <div id="bar-ai" style="background:#63B3ED;width:0%;transition:width 1s;" title="AI Done (Wait: Context)"></div>
  <div id="bar-legal" style="background:#F6E05E;width:0%;transition:width 1s;" title="Legal Done (Wait: AI)"></div>
  <div id="bar-terrain" style="background:#FBD38D;width:0%;transition:width 1s;" title="Terrain Done (Wait: Legal)"></div>
  <div id="bar-error" style="background:#EF4444;width:0%;transition:width 1s;" title="Error"></div>
  <div id="bar-pending" style="background:transparent;width:0%;transition:width 1s;" title="Unstarted (Pending)"></div>
</div>
<div style="display:flex; justify-content:center; gap:16px; font-size:10px; color:#94A3B8; margin-bottom:16px; flex-wrap:wrap; text-transform:uppercase; letter-spacing:1px;">
  <span style="display:flex; align-items:center; gap:6px;"><span style="width:10px;height:10px;border-radius:2px;background:#4ADE80;"></span>Completed</span>
  <span style="display:flex; align-items:center; gap:6px;"><span style="width:10px;height:10px;border-radius:2px;background:#EC4899;"></span>Wait: Scoring</span>
  <span style="display:flex; align-items:center; gap:6px;"><span style="width:10px;height:10px;border-radius:2px;background:#B794F4;"></span>Wait: Amenities</span>
  <span style="display:flex; align-items:center; gap:6px;"><span style="width:10px;height:10px;border-radius:2px;background:#63B3ED;"></span>Wait: Context</span>
  <span style="display:flex; align-items:center; gap:6px;"><span style="width:10px;height:10px;border-radius:2px;background:#F6E05E;"></span>Wait: AI</span>
  <span style="display:flex; align-items:center; gap:6px;"><span style="width:10px;height:10px;border-radius:2px;background:#FBD38D;"></span>Wait: Legal</span>
  <span style="display:flex; align-items:center; gap:6px;"><span style="width:10px;height:10px;border-radius:2px;background:#EF4444;"></span>Errors</span>
</div>
<div style="font-size:11px; color:#94A3B8; text-transform:uppercase; letter-spacing:1px; margin-bottom:8px;">Currently in Pipeline ("Waiting Rooms")</div>
<div class="pipeline" id="pipeline"></div>
<div style="font-size:11px; color:#94A3B8; text-transform:uppercase; letter-spacing:1px; margin-bottom:8px;">Total Processed by Stage</div>
<div class="pipeline" id="dones"></div>
<div style="font-size:11px; color:#94A3B8; text-transform:uppercase; letter-spacing:1px; margin-bottom:8px;">Completed by Score</div>
<div class="pipeline">
  <div class="stage"><div class="name">Score 80+</div><div class="count green" id="high">-</div></div>
  <div class="stage"><div class="name">Score 60-79</div><div class="count cyan" id="med">-</div></div>
  <div class="stage"><div class="name">Score &lt;60</div><div class="count amber" id="low">-</div></div>
</div>
<div style="font-size:11px; color:#94A3B8; text-transform:uppercase; letter-spacing:1px; margin-bottom:8px;">AI Vision Labeler (Claude Haiku)</div>
<div class="pipeline">
  <div class="stage" style="border-top:3px solid #22D3EE"><div class="name">Analyzed</div><div class="count cyan" id="v-analyzed">-</div></div>
  <div class="stage" style="border-top:3px solid #475569"><div class="name">Remaining</div><div class="count" style="color:#94A3B8" id="v-remaining">-</div></div>
  <div class="stage" style="border-top:3px solid #4ADE80"><div class="name">Cost (USD)</div><div class="count green" id="v-cost">-</div></div>
  <div class="stage" style="border-top:3px solid #FBBF24"><div class="name">Rate</div><div class="count amber" id="v-rate">-</div></div>
  <div class="stage" style="border-top:3px solid #B794F4"><div class="name">ETA</div><div class="count" style="color:#B794F4" id="v-eta">-</div></div>
</div>
<div style="font-size:16px; text-align:center; font-weight:bold; margin-bottom:8px; color:#22D3EE" id="v-pctText">0% Vision-Analyzed</div>
<div class="bar-bg" style="margin-bottom:24px;">
  <div id="v-bar-done" style="background:#22D3EE;width:0%;transition:width 1s;height:100%;border-radius:8px;" title="Analyzed"></div>
</div>
<div style="font-size:11px; color:#94A3B8; text-transform:uppercase; letter-spacing:1px; margin-bottom:8px;">Recent Vision Scores</div>
<div class="ticker" id="vision-log">Awaiting data...</div>
<div style="font-size:11px; color:#94A3B8; text-transform:uppercase; letter-spacing:1px; margin-bottom:8px; margin-top:24px;">Live Activity Log</div>
<div class="ticker" id="activity-log">Awaiting data...</div>
<div class="footer">Auto-refreshes every 30s &mdash; <span id="updated"></span></div>
<script>
const order = ['pending','terrain_done','legal_done','ai_done','context_done','amenities_done','error'];
const labels = {pending:'Wait: Terrain',terrain_done:'Wait: Legal',legal_done:'Wait: AI',ai_done:'Wait: Context',context_done:'Wait: Amenities',amenities_done:'Wait: Scoring',error:'Errors'};
const colors = {pending:'#94A3B8',terrain_done:'#FBD38D',legal_done:'#F6E05E',ai_done:'#63B3ED',context_done:'#B794F4',amenities_done:'#EC4899',error:'#EF4444'};
const dones_order = ['terrain_done', 'legal_done', 'ai_done', 'context_done', 'amenities_done', 'completed'];
const dones_labels = {terrain_done:'Terrain Done', legal_done:'Legal Done', ai_done:'AI Done', context_done:'Context Done', amenities_done:'Amenities Done', completed:'Overall Completed'};
let prev_pipeline = null;
let prev_dones = null;

function animateValue(id, end) {
  const obj = document.getElementById(id);
  if (!obj) return;
  let rawText = obj.textContent.replace(/,/g, '') || obj.textContent;
  if(rawText === '-') rawText = "0";
  const start = parseInt(rawText, 10) || 0;
  if (start === end) { obj.textContent = end.toLocaleString(); return; }
  const duration = 1500;
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    obj.textContent = Math.floor(progress * (end - start) + start).toLocaleString();
    if (progress < 1) window.requestAnimationFrame(step);
    else obj.textContent = end.toLocaleString();
  };
  window.requestAnimationFrame(step);
}

async function refresh(){
  try{
    const r=await fetch('/progress');const d=await r.json();
    
    animateValue('completed', d.completed);
    animateValue('pending', d.pipeline.pending||0);
    animateValue('total', d.total_spots);
    document.getElementById('rate').textContent=d.rate_per_hour.toLocaleString()+'/hr';
    document.getElementById('eta').textContent=d.eta_hours?d.eta_hours+'h':'--';
    
    const badge = document.getElementById('status-badge');
    if (d.rate_per_hour > 0) {
        badge.className = 'active-badge';
        badge.innerHTML = '⚡ Active ('+d.rate_per_hour.toLocaleString()+'/hr)';
    } else {
        badge.className = 'idle-badge';
        badge.innerHTML = '⏸️ Idle';
    }
    
    const tot = d.total_spots || 1;
    const setBar = (id, val, title) => {
        const pct = (val||0)/tot*100;
        const el = document.getElementById(id);
        el.style.width = pct + '%';
        el.title = title + ': ' + pct.toFixed(1) + '% (' + (val||0).toLocaleString() + ')';
    };
    
    setBar('bar-pending', d.pipeline['pending'], 'Wait: Terrain');
    setBar('bar-terrain', d.pipeline['terrain_done'], 'Wait: Legal');
    setBar('bar-legal', d.pipeline['legal_done'], 'Wait: AI');
    setBar('bar-ai', d.pipeline['ai_done'], 'Wait: Context');
    setBar('bar-context', d.pipeline['context_done'], 'Wait: Amenities');
    setBar('bar-amenities', d.pipeline['amenities_done'], 'Wait: Scoring');
    setBar('bar-completed', d.completed, 'Completed');
    setBar('bar-error', d.pipeline['error'], 'Error');
    setBar('bar-pending', d.pipeline['pending'], 'Unstarted (Pending)');
    
    document.getElementById('pctText').textContent = d.progress_pct + '% Fully Completed';
    
    animateValue('high', d.score_distribution.high_80plus);
    animateValue('med', d.score_distribution.medium_60_79);
    animateValue('low', d.score_distribution.low_under_60);
    
    let html='';
    for(const s of order){
      const c = d.pipeline[s] || 0;
      let diffHtml = '';
      if (prev_pipeline && prev_pipeline[s] !== undefined) {
         const diff = c - prev_pipeline[s];
         if (diff > 0) diffHtml = `<span style="font-size:12px;color:#EF4444;margin-left:8px;vertical-align:middle;">↑ +${diff}</span>`;
         else if (diff < 0) diffHtml = `<span style="font-size:12px;color:#4ADE80;margin-left:8px;vertical-align:middle;">↓ ${Math.abs(diff)}</span>`;
      }
      const startVal = prev_pipeline ? (prev_pipeline[s] || 0) : c;
      html+=`<div class="stage" style="border-top: 3px solid ${colors[s]}"><div class="name">${labels[s]}</div><div class="count" style="color:${colors[s]}"><span id="count-pipe-${s}">${startVal.toLocaleString()}</span>${diffHtml}</div></div>`;
    }
    document.getElementById('pipeline').innerHTML=html;
    for(const s of order){
      animateValue(`count-pipe-${s}`, d.pipeline[s] || 0);
    }
    prev_pipeline = d.pipeline;
    
    let dones_html='';
    let prev_val = d.total_spots;
    for(const s of dones_order){
      const c=d.total_dones[s]||0;
      let pct = '';
      if (prev_val > 0) {
          const p = Math.round((c / prev_val) * 100);
          pct = `<div style="font-size:10px;color:#94A3B8;margin-top:4px;">(${p}% from previous)</div>`;
      }
      const startVal = prev_dones ? (prev_dones[s] || 0) : c;
      dones_html+=`<div class="stage"><div class="name">${dones_labels[s]}</div><div class="count cyan"><span id="count-done-${s}">${startVal.toLocaleString()}</span></div>${pct}</div>`;
      prev_val = c;
    }
    document.getElementById('dones').innerHTML=dones_html;
    for(const s of dones_order){
      animateValue(`count-done-${s}`, d.total_dones[s] || 0);
    }
    prev_dones = d.total_dones;
    
    if (d.recent_completed && d.recent_completed.length > 0) {
        let logHtml = '';
        d.recent_completed.forEach(item => {
            const timeStr = new Date(item.time).toLocaleTimeString();
            let color = '#4ADE80';
            if (item.score < 60) color = '#FBBF24';
            if (item.score < 40) color = '#EF4444';
            logHtml += `<div><span style="color:#64748B;">[${timeStr}]</span> Spot <span style="color:#E2E8F0;">#${item.id}</span> finished processing. Final Score: <span style="color:${color};font-weight:bold;">${item.score}</span></div>`;
        });
        document.getElementById('activity-log').innerHTML = logHtml;
    } else {
        document.getElementById('activity-log').innerHTML = '<div style="color:#64748B;">No recent activity currently tracked...</div>';
    }

    // Vision labeler section
    if (d.vision) {
        const v = d.vision;
        animateValue('v-analyzed', v.analyzed);
        animateValue('v-remaining', v.remaining);
        document.getElementById('v-cost').textContent = '$' + v.cost_usd.toFixed(2);
        document.getElementById('v-rate').textContent = v.rate_per_hour.toLocaleString() + '/hr';
        document.getElementById('v-eta').textContent = v.eta_hours ? v.eta_hours + 'h' : '--';
        document.getElementById('v-pctText').textContent = v.pct + '% Vision-Analyzed';
        const vBar = document.getElementById('v-bar-done');
        vBar.style.width = v.pct + '%';
        vBar.title = 'Analyzed: ' + v.pct + '% (' + v.analyzed.toLocaleString() + ' spots)';

        if (v.recent && v.recent.length > 0) {
            const scoreBar = (val, max=10) => {
                const pct = Math.round(val / max * 100);
                const col = pct >= 70 ? '#4ADE80' : pct >= 40 ? '#22D3EE' : '#FBBF24';
                return `<span style="display:inline-block;width:${pct*0.4}px;height:6px;background:${col};border-radius:3px;vertical-align:middle;margin-right:2px;" title="${val}/10"></span>`;
            };
            let vHtml = '';
            v.recent.forEach(item => {
                const timeStr = new Date(item.time).toLocaleTimeString();
                const d2 = item.details || {};
                const aiColor = item.ai_score >= 70 ? '#4ADE80' : item.ai_score >= 40 ? '#22D3EE' : '#FBBF24';
                vHtml += `<div style="margin-bottom:6px;">` +
                    `<span style="color:#64748B;">[${timeStr}]</span> ` +
                    `osm:<span style="color:#E2E8F0;">${item.osm_id}</span> ` +
                    `score:<span style="color:${aiColor};font-weight:bold;">${item.ai_score}</span> &nbsp;` +
                    `surface:${scoreBar(d2.surface_quality||0)} ` +
                    `access:${scoreBar(d2.vehicle_access||0)} ` +
                    `space:${scoreBar(d2.open_space||0)} ` +
                    `vans:${scoreBar(d2.van_presence||0)} ` +
                    `clear:${scoreBar(d2.obstruction_absence||0)}` +
                    `</div>`;
            });
            document.getElementById('vision-log').innerHTML = vHtml;
        } else {
            document.getElementById('vision-log').innerHTML = '<div style="color:#64748B;">No vision scores yet...</div>';
        }
    }

    document.getElementById('updated').textContent='Updated: '+new Date().toLocaleTimeString();
  }catch(e){document.getElementById('updated').textContent='Error: '+e.message}
}
refresh();setInterval(refresh,30000);
</script></body></html>"""
    return html, 200, {"Content-Type": "text/html"}


@app.route("/run/terrain", methods=["POST"])
def run_terrain_endpoint() -> Any:
    """Run a terrain batch."""
    data = request.get_json(silent=True) or {}
    batch_size = data.get("batch_size", 500)
    limit = data.get("limit", 500)
    count = run_terrain_batch(batch_size, limit)
    return jsonify({"processed": count, "status": get_status()})


@app.route("/run/legal", methods=["POST"])
def run_legal_endpoint() -> Any:
    """Run a legal batch."""
    data = request.get_json(silent=True) or {}
    batch_size = data.get("batch_size", 200)
    try:
        from pipeline import legal
        count = legal.process_batch(batch_size=batch_size)
    except Exception as e:
        logger.error("Legal failed: %s", e)
        return jsonify({"error": str(e)}), 500
    return jsonify({"processed": count, "status": get_status()})


@app.route("/run/ai", methods=["POST"])
def run_ai_endpoint() -> Any:
    """Run an AI inference batch."""
    data = request.get_json(silent=True) or {}
    batch_size = data.get("batch_size", 100)
    try:
        from pipeline import ai_inference
        count = ai_inference.process_batch(batch_size=batch_size)
    except Exception as e:
        logger.error("AI failed: %s", e)
        return jsonify({"error": str(e)}), 500
    return jsonify({"processed": count, "status": get_status()})


@app.route("/run/context", methods=["POST"])
def run_context_endpoint() -> Any:
    """Run a context scoring batch."""
    data = request.get_json(silent=True) or {}
    batch_size = data.get("batch_size", 100)
    try:
        from pipeline import context_scoring
        count = context_scoring.process_batch(batch_size=batch_size)
    except Exception as e:
        logger.error("Context scoring failed: %s", e)
        return jsonify({"error": str(e)}), 500
    return jsonify({"processed": count, "status": get_status()})


@app.route("/run/amenities", methods=["POST"])
def run_amenities_endpoint() -> Any:
    """Run an amenities scoring batch."""
    data = request.get_json(silent=True) or {}
    batch_size = data.get("batch_size", 500)
    try:
        from pipeline import amenities_scoring
        count = amenities_scoring.process_batch(batch_size=batch_size)
    except Exception as e:
        logger.error("Amenities scoring failed: %s", e)
        return jsonify({"error": str(e)}), 500
    return jsonify({"processed": count, "status": get_status()})


@app.route("/run/scoring", methods=["POST"])
def run_scoring_endpoint() -> Any:
    """Run a scoring batch."""
    data = request.get_json(silent=True) or {}
    batch_size = data.get("batch_size", 500)
    try:
        from pipeline import scoring
        count = scoring.process_batch(batch_size=batch_size)
    except Exception as e:
        logger.error("Scoring failed: %s", e)
        return jsonify({"error": str(e)}), 500
    return jsonify({"processed": count, "status": get_status()})


@app.route("/run/ai-vision", methods=["POST"])
def run_ai_vision_endpoint() -> Any:
    """Run an AI vision labeler batch (Claude Haiku)."""
    data = request.get_json(silent=True) or {}
    batch_size = data.get("batch_size", 20)
    dry_run = data.get("dry_run", False)
    try:
        import ai_vision_labeler
        count = ai_vision_labeler.process_batch(
            batch_size=batch_size, dry_run=dry_run
        )
    except Exception as e:
        logger.error("AI vision failed: %s", e)
        return jsonify({"error": str(e)}), 500
    return jsonify({"processed": count, "dry_run": dry_run, "status": get_status()})


@app.route("/run/pipeline", methods=["POST"])
def run_pipeline_endpoint() -> Any:
    """Run one pipeline pass (all stages sequentially)."""
    data = request.get_json(silent=True) or {}
    results = run_pipeline_pass(
        legal_batch=data.get("legal_batch", 200),
        ai_batch=data.get("ai_batch", 100),
        scoring_batch=data.get("scoring_batch", 500),
    )
    return jsonify({"results": results, "status": get_status()})


@app.route("/run/parallel", methods=["POST"])
def run_parallel_endpoint() -> Any:
    """Run terrain + legal + AI in parallel threads, then scoring."""
    data = request.get_json(silent=True) or {}
    results = run_parallel_pass(
        terrain_batch=data.get("terrain_batch", 500),
        terrain_limit=data.get("terrain_limit", 500),
        legal_batch=data.get("legal_batch", 100),
        ai_batch=data.get("ai_batch", 100),
        context_batch=data.get("context_batch", 500),
        amenities_batch=data.get("amenities_batch", 500),
        scoring_batch=data.get("scoring_batch", 500),
    )
    return jsonify({"results": results, "status": get_status()})


@app.route("/run/all", methods=["POST"])
def run_all_endpoint() -> Any:
    """Run terrain + pipeline in background thread."""
    job_id = "run_all"
    with _running_lock:
        if _running_jobs.get(job_id):
            return jsonify({"error": "Already running"}), 409
        _running_jobs[job_id] = True

    data = request.get_json(silent=True) or {}
    batch_size = data.get("batch_size", 500)
    passes = data.get("passes", 10)

    def worker() -> None:
        try:
            for i in range(passes):
                logger.info("Pass %d/%d", i + 1, passes)
                run_terrain_batch(batch_size, batch_size)
                run_pipeline_pass()
            logger.info("run_all completed (%d passes)", passes)
        except Exception:
            logger.exception("run_all failed")
        finally:
            with _running_lock:
                _running_jobs[job_id] = False

    threading.Thread(target=worker, daemon=True).start()
    return jsonify({"message": f"Started {passes} passes in background", "status": get_status()})


@app.route("/reset/ai", methods=["POST"])
def reset_ai_endpoint() -> Any:
    """Reset AI scores — reprocess all spots from legal_done stage.

    Use when the AI model or heuristic changes and you want fresh scores.
    Deletes cached satellite tiles so they are re-downloaded.
    """
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                UPDATE spots
                SET ai_score = NULL,
                    satellite_image_path = NULL,
                    context_score = NULL,
                    context_details = NULL,
                    composite_score = NULL,
                    status = 'legal_done',
                    updated_at = NOW()
                WHERE status IN ('ai_done', 'context_done', 'completed')
            """)
            count = cur.rowcount
        conn.commit()
        logger.info("Reset %d spots back to legal_done for AI reprocessing", count)
    finally:
        conn.close()

    # Clear cached satellite tiles
    import shutil
    tile_dir = "/data/satellite_tiles"
    try:
        shutil.rmtree(tile_dir, ignore_errors=True)
        os.makedirs(tile_dir, exist_ok=True)
        logger.info("Cleared satellite tile cache")
    except Exception as e:
        logger.warning("Could not clear tile cache: %s", e)

    return jsonify({"reset": count, "message": f"Reset {count} spots to legal_done", "status": get_status()})


@app.route("/reset/ai-vision", methods=["POST"])
def reset_ai_vision_endpoint() -> Any:
    """Reset ai_details so spots can be re-analyzed by vision labeler.

    Does NOT reset ai_score or status — only clears the vision breakdown.
    """
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                UPDATE spots
                SET ai_details = NULL, updated_at = NOW()
                WHERE ai_details IS NOT NULL
            """)
            count = cur.rowcount
        conn.commit()
        logger.info("Reset ai_details for %d spots", count)
    finally:
        conn.close()
    return jsonify({
        "reset": count,
        "message": f"Cleared ai_details for {count} spots",
        "status": get_status(),
    })


@app.route("/reset/all", methods=["POST"])
def reset_all_endpoint() -> Any:
    """Reset ALL spots back to pending — full reprocess from scratch.

    Use for monthly refresh or after changing OSM candidate queries.
    """
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                UPDATE spots
                SET elevation = NULL,
                    slope_pct = NULL,
                    terrain_score = NULL,
                    legal_status = NULL,
                    ai_score = NULL,
                    satellite_image_path = NULL,
                    context_score = NULL,
                    context_details = NULL,
                    composite_score = NULL,
                    status = 'pending',
                    updated_at = NOW()
                WHERE status != 'pending'
            """)
            count = cur.rowcount
        conn.commit()
        logger.info("Full reset: %d spots back to pending", count)
    finally:
        conn.close()

    return jsonify({"reset": count, "message": f"Full reset: {count} spots back to pending", "status": get_status()})


@app.route("/reset/stage", methods=["POST"])
def reset_stage_endpoint() -> Any:
    """Reset spots from a specific stage onwards.

    Body: {"from": "terrain_done"} resets terrain_done and later stages back to pending.
           {"from": "legal_done"} resets legal_done+ back to terrain_done.
           {"from": "ai_done"} resets ai_done+ back to legal_done.
    """
    data = request.get_json(silent=True) or {}
    from_stage = data.get("from")

    stage_map = {
        "terrain_done": ("pending", ["terrain_done", "legal_done", "ai_done", "context_done", "amenities_done", "completed"]),
        "legal_done": ("terrain_done", ["legal_done", "ai_done", "context_done", "amenities_done", "completed"]),
        "ai_done": ("legal_done", ["ai_done", "context_done", "amenities_done", "completed"]),
        "context_done": ("ai_done", ["context_done", "amenities_done", "completed"]),
        "amenities_done": ("context_done", ["amenities_done", "completed"]),
    }

    if from_stage not in stage_map:
        return jsonify({"error": f"Invalid stage. Use: {list(stage_map.keys())}"}), 400

    target_status, affected = stage_map[from_stage]
    placeholders = ",".join(["%s"] * len(affected))

    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            # Clear data for the reset stages
            if target_status == "pending":
                cur.execute(f"""
                    UPDATE spots
                    SET elevation = NULL, slope_pct = NULL, terrain_score = NULL,
                        legal_status = NULL, ai_score = NULL, satellite_image_path = NULL,
                        composite_score = NULL, status = %s, updated_at = NOW()
                    WHERE status IN ({placeholders})
                """, [target_status] + affected)
            elif target_status == "terrain_done":
                cur.execute(f"""
                    UPDATE spots
                    SET legal_status = NULL, ai_score = NULL, satellite_image_path = NULL,
                        composite_score = NULL, status = %s, updated_at = NOW()
                    WHERE status IN ({placeholders})
                """, [target_status] + affected)
            elif target_status == "legal_done":
                cur.execute(f"""
                    UPDATE spots
                    SET ai_score = NULL, satellite_image_path = NULL,
                        context_score = NULL, context_details = NULL,
                        composite_score = NULL, status = %s, updated_at = NOW()
                    WHERE status IN ({placeholders})
                """, [target_status] + affected)
            elif target_status == "ai_done":
                cur.execute(f"""
                    UPDATE spots
                    SET context_score = NULL, context_details = NULL,
                        composite_score = NULL, status = %s, updated_at = NOW()
                    WHERE status IN ({placeholders})
                """, [target_status] + affected)
            elif target_status == "context_done":
                cur.execute(f"""
                    UPDATE spots
                    SET composite_score = NULL, status = %s, updated_at = NOW()
                    WHERE status IN ({placeholders})
                """, [target_status] + affected)
            count = cur.rowcount
        conn.commit()
        logger.info("Reset %d spots from %s back to %s", count, from_stage, target_status)
    finally:
        conn.close()

    return jsonify({
        "reset": count,
        "message": f"Reset {count} spots from {affected} back to {target_status}",
        "status": get_status(),
    })


@app.route("/legal/dashboard", methods=["GET"])
def legal_dashboard_endpoint() -> Any:
    """Serve the legal pipeline dashboard."""
    import pathlib
    html_path = pathlib.Path(__file__).parent / "static" / "legal-dashboard.html"
    if not html_path.exists():
        return "Dashboard file not found", 404
    return html_path.read_text(encoding="utf-8"), 200, {"Content-Type": "text/html"}


@app.route("/legal/sources", methods=["GET"])
def legal_sources_endpoint() -> Any:
    """List all monitored legal sources with health status."""
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT id, name, source_type, region, url, poll_interval_hours,
                       last_checked_at, last_changed_at, consecutive_failures,
                       health, last_error
                FROM legal_source_state
                ORDER BY region, name
            """)
            sources = []
            for row in cur.fetchall():
                sources.append({
                    "id": row[0], "name": row[1], "source_type": row[2],
                    "region": row[3], "url": row[4], "poll_interval_hours": row[5],
                    "last_checked_at": row[6].isoformat() if row[6] else None,
                    "last_changed_at": row[7].isoformat() if row[7] else None,
                    "consecutive_failures": row[8], "health": row[9],
                    "last_error": row[10],
                })
        return jsonify({"sources": sources, "count": len(sources)})
    finally:
        conn.close()


@app.route("/legal/documents", methods=["GET"])
def legal_documents_endpoint() -> Any:
    """List recent legal documents. Supports ?ccaa=, ?type=, ?limit= filters."""
    ccaa = request.args.get("ccaa")
    restriction_type = request.args.get("type")
    limit = min(int(request.args.get("limit", 50)), 200)

    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            conditions = ["status = 'active'"]
            params: list = []

            if ccaa:
                conditions.append("affected_ccaa = %s")
                params.append(ccaa)
            if restriction_type:
                conditions.append("restriction_type = %s")
                params.append(restriction_type)

            where = " AND ".join(conditions)
            params.append(limit)

            cur.execute(f"""
                SELECT id, source_id, title, restriction_type, affected_ccaa,
                       affected_province, affected_municipality, confidence_tier,
                       effective_from, effective_until, seasonal, decree_ref,
                       source_url, created_at, needs_review, llm_confidence,
                       decree_articles
                FROM legal_documents
                WHERE {where}
                ORDER BY created_at DESC
                LIMIT %s
            """, params)

            docs = []
            for row in cur.fetchall():
                decree_articles = row[16]
                if isinstance(decree_articles, str):
                    decree_articles = json.loads(decree_articles)
                docs.append({
                    "id": str(row[0]), "source_id": row[1], "title": row[2],
                    "restriction_type": row[3], "affected_ccaa": row[4],
                    "affected_province": row[5], "affected_municipality": row[6],
                    "confidence_tier": row[7],
                    "effective_from": row[8].isoformat() if row[8] else None,
                    "effective_until": row[9].isoformat() if row[9] else None,
                    "seasonal": row[10], "decree_ref": row[11],
                    "source_url": row[12],
                    "created_at": row[13].isoformat() if row[13] else None,
                    "needs_review": row[14],
                    "llm_confidence": row[15],
                    "decree_articles": decree_articles,
                })
        return jsonify({"documents": docs, "count": len(docs)})
    finally:
        conn.close()


@app.route("/legal/health", methods=["GET"])
def legal_health_endpoint() -> Any:
    """Dashboard with GREEN/YELLOW/RED per source."""
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT health, COUNT(*) FROM legal_source_state GROUP BY health
            """)
            health_counts = {row[0]: row[1] for row in cur.fetchall()}

            cur.execute("""
                SELECT COUNT(*) FROM legal_documents WHERE status = 'active'
            """)
            active_docs = cur.fetchone()[0]

            cur.execute("""
                SELECT COUNT(*) FROM legal_documents
                WHERE created_at > NOW() - INTERVAL '24 hours'
            """)
            recent_docs = cur.fetchone()[0]

            cur.execute("""
                SELECT id, name, health, last_error, consecutive_failures
                FROM legal_source_state
                WHERE health != 'GREEN'
                ORDER BY consecutive_failures DESC
            """)
            unhealthy = [
                {"id": r[0], "name": r[1], "health": r[2],
                 "last_error": r[3], "failures": r[4]}
                for r in cur.fetchall()
            ]

        return jsonify({
            "overall": "RED" if health_counts.get("RED", 0) > 0
                       else "YELLOW" if health_counts.get("YELLOW", 0) > 0
                       else "GREEN",
            "sources": health_counts,
            "active_documents": active_docs,
            "documents_last_24h": recent_docs,
            "unhealthy_sources": unhealthy,
        })
    finally:
        conn.close()


@app.route("/legal/ingest-email", methods=["POST"])
def legal_ingest_email_endpoint() -> Any:
    """Ingest a legal bulletin email from n8n IMAP workflow."""
    import re

    data = request.get_json(silent=True) or {}
    sender = data.get("from", "")
    subject = data.get("subject", "")
    text = data.get("text", "")
    email_date = data.get("date", "")

    sender_map = {
        "gencat.cat": ("decree_cataluna", "cataluna"),
        "xunta.gal": ("decree_galicia", "galicia"),
        "jccm.es": ("decree_castilla_la_mancha", "castilla_la_mancha"),
        "navarra.es": ("bon_navarra_html", "navarra"),
        "juntaex.es": ("doe_extremadura", "extremadura"),
        "larioja.org": ("bor_la_rioja_html", "la_rioja"),
    }

    source_id = None
    ccaa = None
    for domain, (sid, region) in sender_map.items():
        if domain in sender.lower():
            source_id = sid
            ccaa = region
            break

    if not source_id:
        return jsonify({"error": "Unknown sender domain", "sender": sender}), 400

    keyword_pattern = re.compile(
        r"autocaravana|pernocta|acampada|estacionamiento|camping|caravana|"
        r"prohibi.*aparcar|incendios?\s*forestales|medio\s*ambiente|"
        r"turismo|parque\s*natural",
        re.IGNORECASE,
    )

    if not keyword_pattern.search(f"{subject} {text}"):
        return jsonify({"status": "filtered", "reason": "no_keyword_match"})

    import hashlib
    content_hash = hashlib.sha256(
        f"{source_id}:{subject}:{email_date}".encode()
    ).hexdigest()

    from legal.source_monitor import store_legal_document
    conn = get_db_connection()
    try:
        doc_id = store_legal_document(
            conn,
            source_id=source_id,
            title=subject,
            restriction_type="other",
            content_hash=content_hash,
            body=text[:5000],
            raw_text=text[:10000],
            confidence_tier="unverified",
            affected_ccaa=ccaa,
        )
        conn.commit()
    finally:
        conn.close()

    if doc_id:
        logger.info("Ingested email from %s: %s", source_id, subject[:80])
        return jsonify({"status": "stored", "document_id": doc_id})
    return jsonify({"status": "duplicate"})


def _decode_mime_header(raw: str) -> str:
    """Decode MIME-encoded email headers (e.g. =?iso-8859-1?Q?...?=)."""
    import email.header
    parts = email.header.decode_header(raw)
    decoded = []
    for content, charset in parts:
        if isinstance(content, bytes):
            decoded.append(content.decode(charset or "utf-8", errors="replace"))
        else:
            decoded.append(content)
    return " ".join(decoded)


def _extract_email_body(msg) -> str:
    """Extract plain text body from email, falling back to stripped HTML."""
    from html.parser import HTMLParser
    import io

    def _decode_part(part) -> str:
        payload = part.get_payload(decode=True)
        if not payload:
            return ""
        charset = part.get_content_charset() or "utf-8"
        return payload.decode(charset, errors="replace")

    text_body = ""
    html_body = ""

    if msg.is_multipart():
        for part in msg.walk():
            ct = part.get_content_type()
            if ct == "text/plain" and not text_body:
                text_body = _decode_part(part)
            elif ct == "text/html" and not html_body:
                html_body = _decode_part(part)
    else:
        ct = msg.get_content_type()
        if ct == "text/html":
            html_body = _decode_part(msg)
        else:
            text_body = _decode_part(msg)

    if text_body:
        return text_body

    if html_body:
        class _HTMLStripper(HTMLParser):
            SKIP_TAGS = {"style", "script", "head"}
            def __init__(self):
                super().__init__()
                self.result = io.StringIO()
                self._skip_depth = 0
            def handle_starttag(self, tag, attrs):
                if tag.lower() in self.SKIP_TAGS:
                    self._skip_depth += 1
            def handle_endtag(self, tag):
                if tag.lower() in self.SKIP_TAGS and self._skip_depth > 0:
                    self._skip_depth -= 1
            def handle_data(self, d):
                if self._skip_depth == 0:
                    self.result.write(d)
        s = _HTMLStripper()
        s.feed(html_body)
        return s.result.getvalue()

    return ""


@app.route("/legal/poll-email", methods=["POST"])
def legal_poll_email_endpoint() -> Any:
    """Poll Gmail IMAP for legal bulletin emails and ingest them."""
    import email
    import imaplib

    imap_user = os.environ.get("IMAP_USER", "")
    imap_pass = os.environ.get("IMAP_PASSWORD", "")
    imap_host = os.environ.get("IMAP_HOST", "imap.gmail.com")
    imap_port = int(os.environ.get("IMAP_PORT", "993"))

    if not imap_user or not imap_pass:
        return jsonify({"error": "IMAP_USER and IMAP_PASSWORD not configured"}), 500

    sender_domains = [
        "gencat.cat", "xunta.gal", "jccm.es",
        "navarra.es", "juntaex.es", "larioja.org",
    ]

    results = {"processed": 0, "filtered": 0, "stored": 0, "duplicate": 0, "errors": []}

    try:
        mail = imaplib.IMAP4_SSL(imap_host, imap_port)
        mail.login(imap_user, imap_pass)
        mail.select("INBOX")

        _, msg_ids = mail.search(None, "UNSEEN")
        if not msg_ids[0]:
            mail.logout()
            return jsonify({"status": "ok", "message": "no new emails", **results})

        for msg_id in msg_ids[0].split():
            try:
                _, msg_data = mail.fetch(msg_id, "(RFC822)")
                raw_email = msg_data[0][1]
                msg = email.message_from_bytes(raw_email)

                sender = _decode_mime_header(msg.get("From", ""))
                subject = _decode_mime_header(msg.get("Subject", ""))
                date_str = str(msg.get("Date", ""))

                if not any(d in sender.lower() for d in sender_domains):
                    continue

                results["processed"] += 1

                body = _extract_email_body(msg)

                resp = _ingest_email_internal(sender, subject, body, date_str)
                results[resp] = results.get(resp, 0) + 1

            except Exception as e:
                results["errors"].append(str(e)[:200])
                logger.error("Error processing email %s: %s", msg_id, e)

        mail.logout()
    except imaplib.IMAP4.error as e:
        return jsonify({"error": f"IMAP error: {e}"}), 500
    except Exception as e:
        return jsonify({"error": f"Connection error: {e}"}), 500

    return jsonify({"status": "ok", **results})


def _ingest_email_internal(sender: str, subject: str, text: str, email_date: str) -> str:
    """Shared email ingestion logic. Returns status string."""
    import hashlib
    import re

    sender_map = {
        "gencat.cat": ("decree_cataluna", "cataluna"),
        "xunta.gal": ("decree_galicia", "galicia"),
        "jccm.es": ("decree_castilla_la_mancha", "castilla_la_mancha"),
        "navarra.es": ("bon_navarra_html", "navarra"),
        "juntaex.es": ("doe_extremadura", "extremadura"),
        "larioja.org": ("bor_la_rioja_html", "la_rioja"),
    }

    source_id = None
    ccaa = None
    for domain, (sid, region) in sender_map.items():
        if domain in sender.lower():
            source_id = sid
            ccaa = region
            break

    if not source_id:
        return "filtered"

    skip_pattern = re.compile(
        r"solicitud\s+de\s+(una\s+)?suscripci[oó]n|"
        r"confirme?\s+su\s+cuenta|"
        r"confirmar\s+suscripci[oó]n|"
        r"activar\s+suscripci[oó]n|"
        r"baja\s+de\s+suscripci[oó]n|"
        r"env[ií]o\s+de\s+suscripciones|"
        r"servicio\s+de\s+suscripci[oó]n|"
        r"verificar?\s+correo|"
        r"welcome|bienvenid[oa]",
        re.IGNORECASE,
    )
    if skip_pattern.search(subject):
        return "filtered"

    keyword_pattern = re.compile(
        r"autocaravana|pernocta|acampada|estacionamiento|camping|caravana|"
        r"prohibi.*aparcar|incendios?\s*forestales|medio\s*ambiente|"
        r"turismo|parque\s*natural",
        re.IGNORECASE,
    )

    combined = f"{subject} {text}"
    if not keyword_pattern.search(combined):
        return "filtered"

    combined_lower = combined.lower()
    if re.search(r"incendio|fuego|quema", combined_lower):
        restriction_type = "fire_ban"
    elif re.search(r"acampada|camping|campamento", combined_lower):
        restriction_type = "camping_ban"
    elif re.search(r"pernocta|nocturno", combined_lower):
        restriction_type = "overnight_ban"
    elif re.search(r"aparcar|estacionamiento|aparcamiento", combined_lower):
        restriction_type = "parking_ban"
    elif re.search(r"acceso|circulaci[oó]n|restricci[oó]n.*paso", combined_lower):
        restriction_type = "access_restriction"
    elif re.search(r"temporada|estacional|verano|periodo", combined_lower):
        restriction_type = "seasonal_closure"
    else:
        restriction_type = "other"

    content_hash = hashlib.sha256(
        f"{source_id}:{subject}:{email_date}".encode()
    ).hexdigest()

    from legal.source_monitor import store_legal_document
    conn = get_db_connection()
    try:
        doc_id = store_legal_document(
            conn,
            source_id=source_id,
            title=subject,
            restriction_type=restriction_type,
            content_hash=content_hash,
            body=text[:5000],
            raw_text=text[:10000],
            confidence_tier="unverified",
            affected_ccaa=ccaa,
        )
        conn.commit()
    finally:
        conn.close()

    if doc_id:
        logger.info("Ingested email [%s] from %s: %s", restriction_type, source_id, subject[:80])
        return "stored"
    return "duplicate"


@app.route("/run/legal-poll", methods=["POST"])
def run_legal_poll_endpoint() -> Any:
    """Manually trigger a legal source poll."""
    data = request.get_json(silent=True) or {}
    source_ids = data.get("source_ids")

    try:
        from legal.scheduler import LegalScheduler
        scheduler = LegalScheduler()
        scheduler.run(once=True)
        return jsonify({"message": "Legal poll completed"})
    except Exception as e:
        logger.error("Legal poll failed: %s", e)
        return jsonify({"error": str(e)}), 500


@app.route("/legal/documents/review", methods=["GET"])
def legal_documents_review_endpoint() -> Any:
    """List documents that need review: needs_review=true OR confidence_tier='unverified'."""
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT id, source_id, title, restriction_type, affected_ccaa,
                       affected_province, affected_municipality, confidence_tier,
                       effective_from, effective_until, seasonal, decree_ref,
                       source_url, created_at, needs_review, llm_confidence,
                       decree_articles, body, raw_text
                FROM legal_documents
                WHERE status = 'active'
                  AND (needs_review = TRUE OR confidence_tier = 'unverified')
                ORDER BY
                    needs_review DESC,
                    llm_confidence ASC NULLS FIRST,
                    created_at DESC
            """)

            docs = []
            for row in cur.fetchall():
                decree_articles = row[16]
                if isinstance(decree_articles, str):
                    decree_articles = json.loads(decree_articles)
                raw_text = row[18] or ""
                docs.append({
                    "id": str(row[0]), "source_id": row[1], "title": row[2],
                    "restriction_type": row[3], "affected_ccaa": row[4],
                    "affected_province": row[5], "affected_municipality": row[6],
                    "confidence_tier": row[7],
                    "effective_from": row[8].isoformat() if row[8] else None,
                    "effective_until": row[9].isoformat() if row[9] else None,
                    "seasonal": row[10], "decree_ref": row[11],
                    "source_url": row[12],
                    "created_at": row[13].isoformat() if row[13] else None,
                    "needs_review": row[14],
                    "llm_confidence": row[15],
                    "decree_articles": decree_articles,
                    "body": (row[17] or "")[:2000],
                    "raw_text_preview": raw_text[:500],
                })
        return jsonify({"documents": docs, "count": len(docs)})
    finally:
        conn.close()


@app.route("/legal/documents/<doc_id>/review", methods=["POST"])
def legal_document_review_action(doc_id: str) -> Any:
    """Review action on a document: verify, dismiss, or update type."""
    data = request.get_json(silent=True) or {}
    action = data.get("action")

    if action not in ("verify", "dismiss", "update_type", "hide"):
        return jsonify({"error": "action must be: verify, dismiss, update_type, hide"}), 400

    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            if action == "verify":
                new_type = data.get("restriction_type")
                updates = [
                    "confidence_tier = 'verified'",
                    "needs_review = FALSE",
                    "updated_at = NOW()",
                ]
                params: list = []
                if new_type:
                    updates.append("restriction_type = %s")
                    params.append(new_type)
                params.append(doc_id)
                cur.execute(
                    f"UPDATE legal_documents SET {', '.join(updates)} WHERE id = %s",
                    params,
                )

            elif action == "dismiss":
                cur.execute(
                    "UPDATE legal_documents SET status = 'superseded', needs_review = FALSE, updated_at = NOW() WHERE id = %s",
                    (doc_id,),
                )

            elif action == "hide":
                cur.execute(
                    "UPDATE legal_documents SET needs_review = TRUE, updated_at = NOW() WHERE id = %s",
                    (doc_id,),
                )

            elif action == "update_type":
                new_type = data.get("restriction_type")
                if not new_type:
                    return jsonify({"error": "restriction_type required"}), 400
                cur.execute(
                    "UPDATE legal_documents SET restriction_type = %s, needs_review = FALSE, updated_at = NOW() WHERE id = %s",
                    (new_type, doc_id),
                )

            if cur.rowcount == 0:
                return jsonify({"error": "document not found"}), 404

        conn.commit()
        logger.info("Review action '%s' on document %s", action, doc_id)
        return jsonify({"status": "ok", "action": action, "document_id": doc_id})
    finally:
        conn.close()


def main() -> None:
    parser = argparse.ArgumentParser(description="Worker HTTP API")
    parser.add_argument("--port", type=int, default=8001, help="Port (default: 8001)")
    args = parser.parse_args()

    logger.info("Starting worker API on port %d", args.port)
    app.run(host="0.0.0.0", port=args.port, debug=False, threaded=True)


if __name__ == "__main__":
    main()

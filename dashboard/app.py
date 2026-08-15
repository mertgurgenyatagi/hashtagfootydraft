"""Very small pywebview dashboard for watching bot_ai/train.py run.

    python -m dashboard.app

Polls checkpoints/status.json every 2s and pushes it into the page. Nothing
fancier than that -- if train.py isn't running yet, it just waits.
"""

import json
import time
from pathlib import Path

import webview

STATUS_PATH = Path(__file__).resolve().parent.parent / "checkpoints" / "status.json"

HTML = """
<!doctype html><html><head><meta charset="utf-8">
<style>
body{font-family:system-ui,sans-serif;background:#111;color:#eee;padding:16px;margin:0}
h1{font-size:15px;color:#8ab4f8;margin:0 0 12px}
.row{display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #333;font-size:13px}
.row span:first-child{color:#999}
#spark{width:100%;height:60px;margin-top:12px;background:#1a1a1a;border-radius:4px;display:block}
#status{color:#666;font-size:11px;margin-top:8px}
</style></head>
<body>
<h1>#footydraft bot training</h1>
<div class="row"><span>Update</span><span id="update">-</span></div>
<div class="row"><span>Elapsed</span><span id="elapsed">-</span></div>
<div class="row"><span>Device</span><span id="device">-</span></div>
<div class="row"><span>Avg reward (recent)</span><span id="reward">-</span></div>
<div class="row"><span>Policy / value loss</span><span id="loss">-</span></div>
<div class="row"><span>Champion version</span><span id="champion">-</span></div>
<div class="row"><span>Last arena win-rate</span><span id="arena">-</span></div>
<canvas id="spark"></canvas>
<div id="status">waiting for checkpoints/status.json...</div>
<script>
function fmtTime(s){
  s = Math.floor(s);
  const h = Math.floor(s/3600), m = Math.floor((s%3600)/60), sec = s%60;
  return h+'h '+m+'m '+sec+'s';
}
function drawSpark(values){
  const c = document.getElementById('spark');
  const ctx = c.getContext('2d');
  c.width = c.clientWidth; c.height = 60;
  ctx.clearRect(0,0,c.width,c.height);
  if (values.length < 2) return;
  const min = Math.min(...values), max = Math.max(...values);
  const range = (max - min) || 1;
  ctx.strokeStyle = '#8ab4f8'; ctx.lineWidth = 1.5; ctx.beginPath();
  values.forEach((v,i) => {
    const x = (i/(values.length-1)) * c.width;
    const y = c.height - ((v - min)/range) * c.height;
    i === 0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
  });
  ctx.stroke();
}
function updateDashboard(d){
  document.getElementById('update').textContent = d.update;
  document.getElementById('elapsed').textContent = fmtTime(d.elapsed_seconds);
  document.getElementById('device').textContent = d.device;
  document.getElementById('reward').textContent = d.recent_avg_reward.toFixed(3);
  document.getElementById('loss').textContent = d.policy_loss.toFixed(4) + ' / ' + d.value_loss.toFixed(4);
  document.getElementById('champion').textContent = 'v' + d.champion_version;
  if (d.last_arena) {
    document.getElementById('arena').textContent =
      (d.last_arena.win_rate*100).toFixed(1) + '% ' + (d.last_arena.promoted ? '(promoted)' : '(held)');
  }
  document.getElementById('status').textContent = 'last update: ' + new Date().toLocaleTimeString();
  drawSpark(d.reward_history || []);
}
</script>
</body></html>
"""


def poll(window):
    while True:
        if STATUS_PATH.exists():
            try:
                data = json.loads(STATUS_PATH.read_text())
                window.evaluate_js(f"updateDashboard({json.dumps(data)})")
            except Exception:
                pass
        time.sleep(2)


def main():
    window = webview.create_window("footydraft bot training", html=HTML, width=420, height=540)
    webview.start(poll, window)


if __name__ == "__main__":
    main()

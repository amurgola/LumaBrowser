const fs = require('fs');
const path = require('path');

class LabRunReport {
  static write(outDir, steps, meta) {
    try {
      fs.mkdirSync(outDir, { recursive: true });
      fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify({ steps, meta }, null, 2));
      fs.writeFileSync(path.join(outDir, 'index.html'), LabRunReport.indexHtml(steps));
    } catch (_) {}
  }

  static readStepB64(outDir, step) {
    try {
      if (!step || !step.file || !outDir) return null;
      return fs.readFileSync(path.join(outDir, step.file)).toString('base64');
    } catch (_) {
      return null;
    }
  }

  static stamp(d = new Date()) {
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
  }

  static indexHtml(steps) {
    const cards = steps.map((s) => LabRunReport._card(s)).join('');
    return `<!doctype html><meta charset="utf-8"><title>RP Lab run</title><body style="font-family:sans-serif;max-width:1000px;margin:20px auto">
      <h1>Roleplay Lab: run trace</h1>${cards}</body>`;
  }

  static _card(s) {
    const esc = LabRunReport._escape;
    const p = s.params || {};
    const rows = Object.keys(p).map((k) => `<tr><td>${esc(k)}</td><td>${esc(p[k])}</td></tr>`).join('');
    const img = s.file ? `<img src="${esc(s.file)}" style="max-width:420px;border:1px solid #ccc">` : '<em>no image</em>';
    return `<div style="margin:16px 0;padding:12px;border:1px solid #ddd;border-radius:8px">
        <h3>${esc(s.seq)}. ${esc(s.key)}${s.replayed ? ' (replayed)' : ''}</h3>
        <div style="display:flex;gap:16px;flex-wrap:wrap"><div>${img}</div>
        <table style="font:12px monospace;border-collapse:collapse">${rows}</table></div></div>`;
  }

  static _escape(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
}

module.exports = LabRunReport;

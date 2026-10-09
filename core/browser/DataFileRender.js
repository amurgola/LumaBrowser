class DataFileRender {
  static RENDERABLE_MIME = new Set([
    'text/csv',
    'application/csv',
    'text/tab-separated-values',
    'text/tsv',
  ]);

  static RENDERABLE_EXT = /\.(csv|tsv)(?:[?#].*)?$/i;

  static GENERIC_MIME = new Set([
    '',
    'application/octet-stream',
    'binary/octet-stream',
    'application/download',
    'text/plain',
  ]);

  static DEFAULT_FILENAME = 'data.csv';

  static isRenderableDataFile({ mimeType = '', filename = '', url = '' } = {}) {
    const mime = DataFileRender._baseMime(mimeType);
    if (DataFileRender.RENDERABLE_MIME.has(mime)) return true;
    if (!DataFileRender.GENERIC_MIME.has(mime)) return false;
    return DataFileRender._hasRenderableExtension(filename, url);
  }

  static buildDataFileHtml(text, meta = {}) {
    const filename = meta.filename || DataFileRender.DEFAULT_FILENAME;
    const summary = DataFileRender._summarize(text, meta.byteLength);
    const payload = Buffer.from(text, 'utf8').toString('base64');
    return DataFileRender._renderPage(text, filename, summary, payload);
  }

  static _baseMime(mimeType) {
    return String(mimeType).split(';')[0].trim().toLowerCase();
  }

  static _hasRenderableExtension(filename, url) {
    return DataFileRender.RENDERABLE_EXT.test(filename) || DataFileRender.RENDERABLE_EXT.test(url);
  }

  static _summarize(text, byteLength) {
    const rows = DataFileRender._countRows(text);
    const bytes = Number.isFinite(byteLength) ? byteLength : Buffer.byteLength(text, 'utf8');
    return [
      `${rows.toLocaleString()} row${rows === 1 ? '' : 's'}`,
      DataFileRender._formatBytes(bytes),
    ].filter(Boolean).join(' · ');
  }

  static _countRows(text) {
    if (!text) return 0;
    let rows = 0;
    for (let i = 0; i < text.length; i++) {
      if (text.charCodeAt(i) === 10) rows++;
    }
    if (text.charCodeAt(text.length - 1) !== 10) rows++;
    return rows;
  }

  static _formatBytes(n) {
    if (!Number.isFinite(n) || n < 0) return '';
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  }

  static _escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  static _escapeAttr(str) {
    return DataFileRender._escapeHtml(str).replace(/"/g, '&quot;');
  }

  static _renderPage(text, filename, summary, payload) {
    const name = DataFileRender._escapeHtml(filename);
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${name}</title>
<style>
  :root { color-scheme: light dark; }
  * { box-sizing: border-box; }
  html, body { margin: 0; height: 100%; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    background: #f7f7f8; color: #1f2328;
    display: flex; flex-direction: column;
  }
  @media (prefers-color-scheme: dark) {
    body { background: #1b1c1f; color: #e6e6e6; }
    header.lb-bar { background: #25262a !important; border-color: #34363b !important; }
    pre.lb-data { background: #1b1c1f !important; color: #e6e6e6 !important; }
  }
  header.lb-bar {
    flex: 0 0 auto;
    display: flex; align-items: center; gap: 14px;
    padding: 10px 16px;
    background: #fff; border-bottom: 1px solid #e3e3e6;
    font-size: 13px;
  }
  header.lb-bar .lb-name { font-weight: 600; }
  header.lb-bar .lb-sub { opacity: .65; }
  header.lb-bar .lb-spacer { flex: 1 1 auto; }
  header.lb-bar a.lb-dl {
    text-decoration: none; font-size: 12px; font-weight: 500;
    padding: 5px 12px; border-radius: 6px;
    background: #2563eb; color: #fff;
  }
  header.lb-bar a.lb-dl:hover { background: #1d4ed8; }
  pre.lb-data {
    flex: 1 1 auto; margin: 0; padding: 16px;
    overflow: auto;
    font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
    font-size: 12.5px; line-height: 1.5;
    white-space: pre; tab-size: 4;
    background: #fff;
  }
</style>
</head>
<body>
  <header class="lb-bar">
    <span class="lb-name">${name}</span>
    <span class="lb-sub">${DataFileRender._escapeHtml(summary)}</span>
    <span class="lb-spacer"></span>
    <a class="lb-dl" id="lb-download" download="${DataFileRender._escapeAttr(filename)}" href="#">Download</a>
  </header>
  <pre class="lb-data" id="lb-data">${DataFileRender._escapeHtml(text)}</pre>
  <script>
    (function () {
      try {
        var b64 = "${payload}";
        var bin = atob(b64);
        var bytes = new Uint8Array(bin.length);
        for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        var blob = new Blob([bytes], { type: "text/csv" });
        var a = document.getElementById("lb-download");
        a.href = URL.createObjectURL(blob);
      } catch (e) { /* download button best-effort */ }
    })();
  </script>
</body>
</html>`;
  }
}

module.exports = DataFileRender;

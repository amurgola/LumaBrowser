class ArtifactDocumentShell {
  static SCROLLBAR_CSS = [
    '  ::-webkit-scrollbar { width: 8px; height: 8px; }',
    '  ::-webkit-scrollbar-track { background: transparent; }',
    '  ::-webkit-scrollbar-thumb { background-color: rgba(245, 144, 52, 0.15); border-radius: 4px; }',
    '  ::-webkit-scrollbar-thumb:hover { background-color: rgba(245, 144, 52, 0.30); }',
    '  ::-webkit-scrollbar-corner { background: transparent; }',
    '  html { scrollbar-width: thin; scrollbar-color: rgba(245, 144, 52, 0.15) transparent; }',
  ].join('\n');

  static wrap(title, bodyHtml) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  html, body { margin: 0; background: #0b1220; color: #e6e9f2;
    font-family: -apple-system, "Segoe UI", system-ui, sans-serif;
    font-size: 15px; line-height: 1.6; }
  body { padding: 32px 28px 64px; }
  .cm-art-body, .cm-art-md, .cm-art-center { max-width: 860px; margin: 0 auto; }
  .cm-art-center { display: flex; justify-content: center; padding: 24px 0; }
  .cm-art-center svg { max-width: 100%; height: auto; }
  .cm-art-img { max-width: 100%; height: auto; border-radius: 8px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.4); }
  a { color: #f59034; }
  h1, h2, h3, h4 { line-height: 1.25; }
  hr { border: none; border-top: 1px solid rgba(255,255,255,0.12); margin: 24px 0; }
  blockquote { margin: 16px 0; padding: 4px 16px; border-left: 3px solid #f59034;
    color: #b9c0d4; }
  table { border-collapse: collapse; margin: 16px 0; width: 100%; }
  th, td { border: 1px solid rgba(255,255,255,0.14); padding: 7px 12px; text-align: left; }
  th { background: rgba(255,255,255,0.05); }
  code { font-family: ui-monospace, "Cascadia Mono", Menlo, monospace;
    background: rgba(255,255,255,0.07); padding: 1px 5px; border-radius: 4px; font-size: 0.9em; }
  pre.cm-art-code { background: #161a23; border: 1px solid rgba(255,255,255,0.10);
    border-radius: 10px; padding: 18px 20px; overflow: auto; max-width: 980px;
    margin: 0 auto; }
  pre.cm-art-code code { background: none; padding: 0; font-size: 13px; line-height: 1.55; }
  .cm-art-codehead { max-width: 980px; margin: 0 auto 10px; color: #8a95ad;
    font: 12px ui-monospace, monospace; }
${ArtifactDocumentShell.SCROLLBAR_CSS}
</style>
</head>
<body>
${bodyHtml}
</body>
</html>`;
  }
}

module.exports = ArtifactDocumentShell;

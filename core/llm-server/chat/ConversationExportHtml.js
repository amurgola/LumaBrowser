const fs = require('fs');
const path = require('path');
const ModuleScriptBundler = require('./ModuleScriptBundler');

class ConversationExportHtml {
  static PAGE_WIDTH = 900;
  static SHARE_PUBLIC_DIR = path.join(__dirname, '..', '..', 'network-sharing', 'webapp', 'public');
  static LLM_UI_DIR = path.join(__dirname, '..', 'ui');
  static IMPORT_MAP_RE = /<script type="importmap">([\s\S]*?)<\/script>\s*/;

  static build(data, { readAsset } = {}) {
    const read = readAsset || ConversationExportHtml.readAsset;
    let html = read('/share-view.html');
    const importMap = ConversationExportHtml._importMap(html);
    html = ConversationExportHtml._inlineStylesheets(html, read);
    html = ConversationExportHtml._removeFavicon(html);
    html = ConversationExportHtml._inlineScripts(html, read, data, importMap);
    return ConversationExportHtml._addPageChrome(html);
  }

  static scriptSafeJson(value) {
    const bs = String.fromCharCode(92);
    return JSON.stringify(value)
      .replace(/</g, `${bs}u003c`)
      .replace(new RegExp(String.fromCharCode(0x2028), 'g'), `${bs}u2028`)
      .replace(new RegExp(String.fromCharCode(0x2029), 'g'), `${bs}u2029`);
  }

  static readAsset(rel) {
    const file = rel.startsWith('/llm-ui/')
      ? path.join(ConversationExportHtml.LLM_UI_DIR, rel.slice('/llm-ui/'.length))
      : path.join(ConversationExportHtml.SHARE_PUBLIC_DIR, rel.replace(/^\//, ''));
    return fs.readFileSync(file, 'utf8');
  }

  static _importMap(html) {
    const m = html.match(ConversationExportHtml.IMPORT_MAP_RE);
    return m ? JSON.parse(m[1]) : null;
  }

  static _inlineStylesheets(html, read) {
    return html.replace(/<link rel="stylesheet" href="(\/[^"]+)">/g,
      (_m, href) => `<style>\n${read(href)}\n</style>`);
  }

  static _removeFavicon(html) {
    return html.replace(/<link rel="icon"[^>]*>\s*/g, '');
  }

  static _inlineScripts(html, read, data, importMap) {
    const bundler = new ModuleScriptBundler({ readAsset: read, importMap });
    const inline = (source) => `<script>\n${ConversationExportHtml._escapeScriptCloser(source)}\n</script>`;
    return html
      .replace(ConversationExportHtml.IMPORT_MAP_RE, '')
      .replace(/<script src="(\/[^"]+)"><\/script>/g, (_m, src) => inline(read(src)))
      .replace(/<script type="module" src="(\/[^"]+)"><\/script>/g, (_m, src) =>
        `<script>window.__LUMA_EXPORT__ = ${ConversationExportHtml.scriptSafeJson(data)};</script>\n  ${inline(bundler.bundle(src))}`);
  }

  static _escapeScriptCloser(source) {
    const bs = String.fromCharCode(92);
    return source.replace(/<\/script/gi, `<${bs}/script`);
  }

  static _addPageChrome(html) {
    return html.replace('</head>',
      '<style>\n'
      + '  html, body { width: 100%; }\n'
      + `  .sv-wrap { max-width: ${ConversationExportHtml.PAGE_WIDTH - 40}px; }\n`
      + '  @media print { .sv-wrap { padding-top: 12px; } .cm-attach-card { break-inside: avoid; } }\n'
      + '</style>\n</head>');
  }
}

module.exports = ConversationExportHtml;

'use strict';

const crypto = require('crypto');

class WebviewHtml {
  static PLACEHOLDERS = ['/*@@CSS@@*/', '/*@@SHARED_TOOL_GRAMMAR@@*/', '/*@@APP_JS@@*/'];

  static build(template, { uri, nonce, cspSource }) {
    WebviewHtml._assertPlaceholders(template);
    const script = (rel) => `<script nonce="${nonce}" src="${uri(rel)}"></script>`;
    return template
      .replace(/<meta charset="utf-8">/i, (m) => `${m}\n<meta http-equiv="Content-Security-Policy" content="${WebviewHtml.csp(nonce, cspSource)}">`)
      .replace(/<style>\s*\/\*@@CSS@@\*\/\s*<\/style>/, () =>
        `<link rel="stylesheet" href="${uri('media/luma.css')}">\n<link rel="stylesheet" href="${uri('resources/vscode.css')}">`)
      .replace('<script>/*@@SHARED_TOOL_GRAMMAR@@*/</script>', () => `${script('resources/host.js')}\n${script('media/shared/tool-grammar.js')}`)
      .replace('<script>/*@@APP_JS@@*/</script>', () => script('media/app.js'));
  }

  static csp(nonce, cspSource) {
    return [
      "default-src 'none'",
      `style-src ${cspSource} 'unsafe-inline'`,
      `script-src 'nonce-${nonce}'`,
      `img-src ${cspSource} https: data:`,
      `font-src ${cspSource}`,
    ].join('; ');
  }

  static makeNonce() {
    return crypto.randomBytes(16).toString('base64').replace(/[^A-Za-z0-9]/g, '');
  }

  static _assertPlaceholders(template) {
    for (const p of WebviewHtml.PLACEHOLDERS) {
      if (!template.includes(p)) throw new Error(`webview template is missing ${p}`);
    }
  }
}

module.exports = WebviewHtml;

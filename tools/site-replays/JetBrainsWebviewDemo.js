const fs = require('fs');
const path = require('path');
const IdeWebviewDemo = require('./IdeWebviewDemo');
const IdePageInliner = require('./IdePageInliner');

class JetBrainsWebviewDemo extends IdeWebviewDemo {
  static DEFAULT_OUT = 'tmp/jetbrains-webview';
  static BRIDGE = '<script>window.__lumaSend = (s) => window.__lumaSendNative(s);</script>';

  static THEME_DARK = {
    '--ide-bg': '#1e1f22', '--ide-fg': '#dfe1e5', '--ide-border': '#393b40', '--ide-editor-bg': '#1e1f22', '--ide-editor-fg': '#bcbec4',
    '--ide-input-bg': '#2b2d30', '--ide-muted': '#8c8f97', '--ide-link': '#548af7', '--ide-hover': 'rgba(255,255,255,0.06)',
    '--ide-font': '"Segoe UI", system-ui, sans-serif', '--ide-font-size': '13px', '--ide-mono': '"JetBrains Mono", "Cascadia Mono", monospace', '--ide-mono-size': '12px', '--ide-dark': '1',
  };

  static THEME_LIGHT = {
    ...JetBrainsWebviewDemo.THEME_DARK, '--ide-bg': '#f7f8fa', '--ide-fg': '#000000', '--ide-border': '#ebecf0', '--ide-editor-bg': '#ffffff', '--ide-editor-fg': '#080808',
    '--ide-input-bg': '#ffffff', '--ide-muted': '#6c707e', '--ide-link': '#2470b3', '--ide-hover': 'rgba(0,0,0,0.05)', '--ide-dark': '0',
  };

  constructor(root, io) {
    super(root, JetBrainsWebviewDemo.DEFAULT_OUT, io);
    this._sent = [];
  }

  verify({ sent }) {
    const failures = IdeWebviewDemo.missingMessages(sent);
    const prompt = sent.find((m) => m.type === 'prompt');
    if (prompt && (!prompt.payload.context || prompt.payload.context.length !== 1)) failures.push('prompt should carry the context chip');
    return failures;
  }

  async _openPage(page) {
    const html = IdePageInliner.build(this._root, JetBrainsWebviewDemo.BRIDGE);
    fs.writeFileSync(path.join(this.outDir, 'page.html'), html);
    await page.exposeFunction('__lumaSendNative', (json) => { this._sent.push(JSON.parse(json)); });
    await page.setContent(html, { waitUntil: 'load' });
  }

  _dispatch(page, msg) {
    return page.evaluate((m) => window.__luma.dispatch(m), msg);
  }

  _applyTheme(page) {
    return this._dispatch(page, { kind: 'theme', vars: this.light ? JetBrainsWebviewDemo.THEME_LIGHT : JetBrainsWebviewDemo.THEME_DARK });
  }

  async _sentMessages() {
    return this._sent;
  }
}

module.exports = JetBrainsWebviewDemo;

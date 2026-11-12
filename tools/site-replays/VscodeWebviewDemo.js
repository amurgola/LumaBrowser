const fs = require('fs');
const http = require('http');
const path = require('path');
const IdeWebviewDemo = require('./IdeWebviewDemo');
const IdeWebviewFiles = require('../ide/IdeWebviewFiles');
const WebviewHtml = require('../../ide/vscode/src/WebviewHtml');

class VscodeWebviewDemo extends IdeWebviewDemo {
  static DEFAULT_OUT = 'tmp/vscode-webview';
  static BY = 'scripts/vscode-webview-demo.js';
  static NONCE = 'demoNonce123';
  static MIME = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.svg': 'image/svg+xml', '.png': 'image/png' };

  static DARK = {
    '--vscode-sideBar-background': '#181818', '--vscode-editor-background': '#1f1f1f', '--vscode-foreground': '#cccccc',
    '--vscode-editor-foreground': '#cccccc', '--vscode-panel-border': '#2b2b2b', '--vscode-input-background': '#313131',
    '--vscode-list-hoverBackground': '#2a2d2e', '--vscode-list-activeSelectionBackground': '#04395e',
    '--vscode-textLink-foreground': '#4daafc', '--vscode-descriptionForeground': '#9d9d9d',
    '--vscode-font-family': '"Segoe WPC", "Segoe UI", sans-serif', '--vscode-font-size': '13px',
    '--vscode-editor-font-family': 'Consolas, "Courier New", monospace', '--vscode-editor-font-size': '14px',
  };

  static LIGHT = {
    ...VscodeWebviewDemo.DARK, '--vscode-sideBar-background': '#f8f8f8', '--vscode-editor-background': '#ffffff', '--vscode-foreground': '#3b3b3b',
    '--vscode-editor-foreground': '#3b3b3b', '--vscode-panel-border': '#e5e5e5', '--vscode-input-background': '#ffffff',
    '--vscode-list-hoverBackground': '#f2f2f2', '--vscode-list-activeSelectionBackground': '#e8e8e8',
    '--vscode-textLink-foreground': '#005fb8', '--vscode-descriptionForeground': '#616161',
  };

  constructor(root, io) {
    super(root, VscodeWebviewDemo.DEFAULT_OUT, io);
    this._extDir = path.join(root, 'ide', 'vscode');
  }

  verify({ sent, probe }) {
    const failures = IdeWebviewDemo.missingMessages(sent).map((f) => `${f} through host.js`);
    if (sent.length && sent[0].type !== 'ready') failures.push('"ready" was not the first message (host.js must load before app.js)');
    const prompt = sent.find((m) => m.type === 'prompt');
    if (prompt && (!prompt.payload || prompt.payload.text !== 'Fix the failing range test')) failures.push('the prompt payload did not survive the message channel');
    if (probe && probe.light !== this.light) failures.push(`data-light is ${probe.light}, expected ${this.light}`);
    if (probe && !/Segoe/.test(probe.font)) failures.push(`the VS Code font did not reach the page (${probe.font})`);
    if (this.problems.length) failures.push(`${this.problems.length} page problem(s)`);
    return failures;
  }

  fileFor(urlPath) {
    const rel = decodeURIComponent(urlPath.split('?')[0]).replace(/^\/+/, '');
    const base = rel.startsWith('media/') ? this.outDir : this._extDir;
    const file = path.resolve(base, rel);
    return file.startsWith(base + path.sep) ? file : null;
  }

  pageState(over) {
    return super.pageState({ ideName: 'Visual Studio Code', ...over });
  }

  async _openPage(page) {
    IdeWebviewFiles.syncPage(this._root, path.join(this.outDir, 'media'), VscodeWebviewDemo.BY);
    const base = await this._serve();
    const template = fs.readFileSync(path.join(this.outDir, 'media', 'index.html'), 'utf8');
    this._html = WebviewHtml.build(template, { uri: (rel) => `${base}/${rel}`, nonce: VscodeWebviewDemo.NONCE, cspSource: base });
    fs.writeFileSync(path.join(this.outDir, 'page.html'), this._html);
    await page.addInitScript(VscodeWebviewDemo.WEBVIEW_ENVIRONMENT, { vars: this.light ? VscodeWebviewDemo.LIGHT : VscodeWebviewDemo.DARK, isLight: this.light });
    await page.goto(`${base}/`, { waitUntil: 'load' });
    await IdeWebviewDemo.sleep(100);
  }

  static WEBVIEW_ENVIRONMENT = ({ vars, isLight }) => {
    window.__sent = [];
    window.acquireVsCodeApi = () => ({ postMessage: (m) => window.__sent.push(m), getState: () => null, setState: () => {} });
    const apply = () => {
      if (!document.documentElement || !document.body) { requestAnimationFrame(apply); return; }
      for (const k of Object.keys(vars)) document.documentElement.style.setProperty(k, vars[k]);
      document.body.classList.add(isLight ? 'vscode-light' : 'vscode-dark');
    };
    document.addEventListener('DOMContentLoaded', apply);
  };

  async _serve() {
    this._server = http.createServer((req, res) => this._handle(req, res));
    await new Promise((r) => this._server.listen(0, '127.0.0.1', r));
    return `http://127.0.0.1:${this._server.address().port}`;
  }

  _handle(req, res) {
    const p = req.url.split('?')[0];
    if (p === '/favicon.ico') { res.writeHead(204); res.end(); return; }
    if (p === '/') { res.writeHead(200, { 'Content-Type': 'text/html' }); res.end(this._html); return; }
    const file = this.fileFor(p);
    if (!file || !fs.existsSync(file)) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': VscodeWebviewDemo.MIME[path.extname(file)] || 'application/octet-stream' });
    res.end(fs.readFileSync(file));
  }

  _dispatch(page, msg) {
    return page.evaluate((m) => window.postMessage(m, '*'), msg);
  }

  _sentMessages(page) {
    return page.evaluate(() => window.__sent);
  }

  _probe(page) {
    return page.evaluate(() => {
      const cs = getComputedStyle(document.body);
      return { bg: cs.backgroundColor, font: cs.fontFamily, light: document.documentElement.hasAttribute('data-light') };
    });
  }

  async _closeHost() {
    if (this._server) this._server.close();
  }
}

module.exports = VscodeWebviewDemo;

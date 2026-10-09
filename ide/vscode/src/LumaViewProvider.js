'use strict';

const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const WebviewHtml = require('./WebviewHtml');
const SessionStatus = require('./SessionStatus');

class LumaViewProvider {
  static VIEW_ID = 'luma.chat';

  constructor(extensionUri, session, fileSync, log) {
    this.extensionUri = extensionUri;
    this.session = session;
    this.fileSync = fileSync;
    this.log = log;
    this.view = null;
    this._pageReady = false;
    this._queue = [];
    session.on('state', () => this.pushState());
    session.on('frame', (type, payload) => this.dispatch({ kind: 'frame', type, payload }));
    session.on('reset', () => this.dispatch({ kind: 'reset' }));
  }

  get visible() {
    return !!(this.view && this.view.visible);
  }

  resolveWebviewView(view) {
    this.view = view;
    this._pageReady = false;
    this._queue = [];
    view.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this.extensionUri, 'media'), vscode.Uri.joinPath(this.extensionUri, 'resources')],
    };
    view.webview.onDidReceiveMessage((msg) => this.handle(msg));
    view.onDidDispose(() => { if (this.view === view) { this.view = null; this._pageReady = false; } });
    view.webview.html = this.html(view.webview);
  }

  html(webview) {
    const file = path.join(this.extensionUri.fsPath, 'media', 'index.html');
    try {
      return WebviewHtml.build(fs.readFileSync(file, 'utf8'), {
        uri: (rel) => webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, ...rel.split('/'))).toString(),
        nonce: WebviewHtml.makeNonce(),
        cspSource: webview.cspSource,
      });
    } catch (e) {
      this.log(`webview assembly failed: ${e && e.message}`);
      return '<!doctype html><body style="font-family:sans-serif;padding:16px">The Luma page is missing from this build of the extension'
        + ' (media/). Build it with <code>npm run build:vscode</code> in the LumaBrowser repository.</body>';
    }
  }

  dispatch(msg) {
    if (!this.view) return;
    if (!this._pageReady) { this._queue.push(msg); return; }
    this.view.webview.postMessage(msg);
  }

  pushState() {
    this.dispatch({ kind: 'state', state: this.session.stateJson() });
  }

  async reveal(focusInput) {
    try { await vscode.commands.executeCommand(`${LumaViewProvider.VIEW_ID}.focus`); } catch (_) {}
    if (focusInput) this.dispatch({ kind: 'focus' });
  }

  handle(msg) {
    if (!msg || typeof msg.type !== 'string') return;
    const p = msg.payload && typeof msg.payload === 'object' ? msg.payload : {};
    const s = this.session;
    switch (msg.type) {
      case 'ready': this._onPageReady(); break;
      case 'prompt': this._onPrompt(p); break;
      case 'followup': if (typeof p.text === 'string') s.followup(p.text); break;
      case 'approve': s.approve(typeof p.decision === 'string' ? p.decision : 'reject'); break;
      case 'abort': s.abort(); break;
      case 'bridge': break;
      case 'removeContext': if (typeof p.id === 'string') s.removeContext(p.id); break;
      case 'openFile': if (typeof p.path === 'string') this.fileSync.openFile(s.root, p.path, Number.isInteger(p.line) ? p.line : undefined); break;
      case 'showDiff': if (typeof p.path === 'string') this.fileSync.showDiff(s.root, p.path); break;
      case 'insert': if (typeof p.text === 'string') this.fileSync.insertAtCaret(p.text); break;
      case 'copy': if (typeof p.text === 'string') vscode.env.clipboard.writeText(p.text); break;
      case 'start': case 'reconnect': this._onStart(); break;
      case 'settings': vscode.commands.executeCommand('luma.openSettings'); break;
      case 'openUrl': if (typeof p.url === 'string' && /^https?:/i.test(p.url)) vscode.env.openExternal(vscode.Uri.parse(p.url)); break;
      case 'turnEnded': break;
      default: this.log(`unknown page message: ${msg.type}`);
    }
  }

  _onPageReady() {
    this._pageReady = true;
    this.pushState();
    const queued = this._queue;
    this._queue = [];
    for (const m of queued) this.view.webview.postMessage(m);
    if (this.session.status === SessionStatus.OFFLINE) this.session.connect();
  }

  _onPrompt(p) {
    if (typeof p.text !== 'string') return;
    const ids = new Set((Array.isArray(p.context) ? p.context : []).map((c) => c && c.id).filter(Boolean));
    this.session.prompt(p.text, this.session.context.filter((c) => ids.has(c.id)));
  }

  _onStart() {
    if (!vscode.workspace.isTrusted) vscode.commands.executeCommand('workbench.trust.manage');
    else if (!this.session.getRoot()) vscode.commands.executeCommand('workbench.action.files.openFolder');
    else this.session.connect({ startIfNeeded: true });
  }
}

module.exports = LumaViewProvider;

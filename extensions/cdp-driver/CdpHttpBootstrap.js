const CdpDefaults = require('./CdpDefaults');
const LoopbackRequestGuard = require('../../core/shared/net/LoopbackRequestGuard');

class CdpHttpBootstrap {
  static TARGET_ID = '([A-F0-9]+)';

  constructor(server) {
    this._server = server;
  }

  handle(req, res) {
    CdpHttpBootstrap._setHeaders(res);
    const refused = LoopbackRequestGuard.refusal(req, this._server.host);
    if (refused) return CdpHttpBootstrap._json(res, 403, { error: refused });
    const url = req.url || '';
    const route = this._routeFor(req.method, url);
    if (route) return route(url, res);
    CdpHttpBootstrap._json(res, 404, { error: 'Not Found' });
  }

  _routeFor(method, url) {
    if (method === 'GET' && url === '/json/version') return (_u, res) => this._version(res);
    if (method === 'GET' && (url === '/json' || url === '/json/list')) return (_u, res) => this._list(res);
    if (method === 'GET' && url === '/json/protocol') return (_u, res) => CdpHttpBootstrap._json(res, 200, { domains: [] });
    if (method !== 'PUT') return null;
    if (url.startsWith('/json/new')) return (u, res) => this._newTab(u, res);
    if (CdpHttpBootstrap._targetPath('activate', url)) return (u, res) => this._activate(u, res);
    if (CdpHttpBootstrap._targetPath('close', url)) return (u, res) => this._close(u, res);
    return null;
  }

  _version(res) {
    CdpHttpBootstrap._json(res, 200, {
      Browser: 'LumaBrowser/1.0',
      'Protocol-Version': '1.3',
      'User-Agent': 'Mozilla/5.0 LumaBrowser',
      'V8-Version': process.versions.v8 || '',
      'WebKit-Version': '537.36',
      webSocketDebuggerUrl: `${this._wsBase()}/devtools/browser/${this._server.browserUuid}`,
    });
  }

  _list(res) {
    const entries = this._server.targets.all().map((t) => this._descriptor(t.targetId, t.title, t.type, t.url, true));
    CdpHttpBootstrap._json(res, 200, entries);
  }

  _newTab(url, res) {
    const targetUrl = url.slice('/json/new'.length).replace(/^\??/, '');
    this._server.createAutomationTab(targetUrl || 'about:blank', { kind: CdpDefaults.AUTOMATION_TAB_KIND, activate: false })
      .then((tab) => CdpHttpBootstrap._json(res, 200, this._newTabDescriptor(tab)))
      .catch((err) => CdpHttpBootstrap._json(res, 500, { error: err.message }));
  }

  _activate(url, res) {
    const target = this._server.targets.get(CdpHttpBootstrap._targetPath('activate', url));
    if (!target) return CdpHttpBootstrap._text(res, 404, 'No such target');
    this._server.activateTab(target.tabId);
    CdpHttpBootstrap._text(res, 200, 'Target activated');
  }

  _close(url, res) {
    const target = this._server.targets.get(CdpHttpBootstrap._targetPath('close', url));
    if (!target) return CdpHttpBootstrap._text(res, 404, 'No such target');
    this._server.closeTab(target.tabId);
    CdpHttpBootstrap._text(res, 200, 'Target is closing');
  }

  _newTabDescriptor(tab) {
    const target = this._server.targets.byTab(tab.id);
    const id = target ? target.targetId : String(tab.id);
    return this._descriptor(id, tab.title, 'page', tab.url, !!target);
  }

  _descriptor(id, title, type, url, hasSocket) {
    return {
      description: '',
      devtoolsFrontendUrl: '',
      id,
      title: title || '',
      type,
      url: url || '',
      webSocketDebuggerUrl: hasSocket ? `${this._wsBase()}/devtools/page/${id}` : '',
    };
  }

  _wsBase() {
    return `ws://${this._server.host}:${this._server.port()}`;
  }

  static _targetPath(verb, url) {
    const match = url.match(new RegExp(`^/json/${verb}/${CdpHttpBootstrap.TARGET_ID}$`));
    return match ? match[1] : null;
  }

  static _setHeaders(res) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
  }

  static _json(res, status, body) {
    res.statusCode = status;
    res.end(JSON.stringify(body));
  }

  static _text(res, status, text) {
    res.statusCode = status;
    res.end(text);
  }
}

module.exports = CdpHttpBootstrap;

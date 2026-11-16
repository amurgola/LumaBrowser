const CdpDefaults = require('./CdpDefaults');
const ExposedServerKeyGuard = require('../../core/shared/net/ExposedServerKeyGuard');

class CdpHttpBootstrap {
  static TARGET_ID = '([A-F0-9]+)';

  constructor(server) {
    this._server = server;
  }

  handle(req, res) {
    CdpHttpBootstrap._setHeaders(res);
    const refused = ExposedServerKeyGuard.refusal(req, this._server.host, this._server.apiSecurity);
    if (refused) return CdpHttpBootstrap._json(res, refused.status, { error: refused.reason });
    const url = ExposedServerKeyGuard.routedUrl(req, this._server.host);
    const route = this._routeFor(req.method, url, ExposedServerKeyGuard.queryKeyToCarry(req, this._server.host));
    if (route) return route(url, res);
    CdpHttpBootstrap._json(res, 404, { error: 'Not Found' });
  }

  _routeFor(method, url, queryKey) {
    if (method === 'GET' && url === '/json/version') return (_u, res) => this._version(res, queryKey);
    if (method === 'GET' && (url === '/json' || url === '/json/list')) return (_u, res) => this._list(res, queryKey);
    if (method === 'GET' && url === '/json/protocol') return (_u, res) => CdpHttpBootstrap._json(res, 200, { domains: [] });
    if (method !== 'PUT') return null;
    if (url.startsWith('/json/new')) return (u, res) => this._newTab(u, res, queryKey);
    if (CdpHttpBootstrap._targetPath('activate', url)) return (u, res) => this._activate(u, res);
    if (CdpHttpBootstrap._targetPath('close', url)) return (u, res) => this._close(u, res);
    return null;
  }

  _version(res, queryKey) {
    CdpHttpBootstrap._json(res, 200, {
      Browser: 'LumaBrowser/1.0',
      'Protocol-Version': '1.3',
      'User-Agent': 'Mozilla/5.0 LumaBrowser',
      'V8-Version': process.versions.v8 || '',
      'WebKit-Version': '537.36',
      webSocketDebuggerUrl: this._wsUrl(`/devtools/browser/${this._server.browserUuid}`, queryKey),
    });
  }

  _list(res, queryKey) {
    const entries = this._server.targets.all().map((t) => this._descriptor(t.targetId, t.title, t.type, t.url, true, queryKey));
    CdpHttpBootstrap._json(res, 200, entries);
  }

  _newTab(url, res, queryKey) {
    const targetUrl = url.slice('/json/new'.length).replace(/^\??/, '');
    this._server.createAutomationTab(targetUrl || 'about:blank', { kind: CdpDefaults.AUTOMATION_TAB_KIND, activate: false })
      .then((tab) => CdpHttpBootstrap._json(res, 200, this._newTabDescriptor(tab, queryKey)))
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

  _newTabDescriptor(tab, queryKey) {
    const target = this._server.targets.byTab(tab.id);
    const id = target ? target.targetId : String(tab.id);
    return this._descriptor(id, tab.title, 'page', tab.url, !!target, queryKey);
  }

  _descriptor(id, title, type, url, hasSocket, queryKey) {
    return {
      description: '',
      devtoolsFrontendUrl: '',
      id,
      title: title || '',
      type,
      url: url || '',
      webSocketDebuggerUrl: hasSocket ? this._wsUrl(`/devtools/page/${id}`, queryKey) : '',
    };
  }

  _wsUrl(path, queryKey) {
    const query = queryKey ? `?${ExposedServerKeyGuard.QUERY_PARAMETER}=${encodeURIComponent(queryKey)}` : '';
    return `${this._wsBase()}${path}${query}`;
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

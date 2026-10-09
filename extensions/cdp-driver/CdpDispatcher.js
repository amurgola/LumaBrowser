const CdpError = require('./CdpError');
const BrowserDomain = require('./domains/BrowserDomain');
const TargetDomain = require('./domains/TargetDomain');
const LumabyteDomain = require('./domains/LumabyteDomain');
const CommandForwarder = require('./domains/CommandForwarder');

class CdpDispatcher {
  static DOMAINS = [BrowserDomain, TargetDomain, LumabyteDomain];

  static CUSTOM_DOMAIN_PREFIX = 'Lumabyte.';

  constructor(server) {
    this._handlers = CdpDispatcher._handlerTable(server);
    this._forwarder = new CommandForwarder(server);
  }

  async dispatch(method, params, scope) {
    const handler = this._handlers.get(method);
    if (handler) return handler(params, scope);
    if (method.startsWith(CdpDispatcher.CUSTOM_DOMAIN_PREFIX)) throw CdpError.methodNotFound(method);
    return this._forwarder.forward(method, params, scope.session);
  }

  static _handlerTable(server) {
    const table = new Map();
    for (const Domain of CdpDispatcher.DOMAINS) {
      for (const [method, handler] of Object.entries(new Domain(server).handlers())) table.set(method, handler);
    }
    return table;
  }
}

module.exports = CdpDispatcher;

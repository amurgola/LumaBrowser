const NetworkDiscovery = require('../NetworkDiscovery');
const PeerAddress = require('./PeerAddress');

class PeerDiscovery {
  constructor({ getSelfId = () => null, browse = (handlers) => NetworkDiscovery.browse(handlers) } = {}) {
    this._getSelfId = getSelfId;
    this._browse = browse;
    this._browser = null;
    this._found = new Map();
  }

  start() {
    if (this._browser) return;
    const selfId = this._getSelfId();
    this._browser = this._browse({
      onUp: (service) => this._onUp(service, selfId),
      onDown: (service) => this._found.delete(PeerDiscovery.idOf(service)),
    });
  }

  stop() {
    if (!this._browser) return;
    try { this._browser.stop(); } catch (_) {}
    this._browser = null;
  }

  list(knownIds = new Set()) {
    return [...this._found.values()].filter((host) => !knownIds.has(host.id));
  }

  static idOf(service) {
    return (service.txt && service.txt.id) || service.fqdn || service.name;
  }

  _onUp(service, selfId) {
    const id = PeerDiscovery.idOf(service);
    if (selfId && id === selfId) return;
    const address = PeerAddress.pick(service.addresses) || service.host;
    this._found.set(id, {
      id,
      name: service.name,
      address,
      port: service.port,
      endpoint: address ? `http://${address}:${service.port}` : null,
      txt: service.txt || {},
      fromMdns: true,
    });
  }
}

module.exports = PeerDiscovery;

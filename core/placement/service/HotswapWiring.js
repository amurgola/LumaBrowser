const PlacementLayout = require('../../shared/runtime/PlacementLayout');
const PlacementStore = require('../../shared/runtime/placement/PlacementStore');
const BestEffort = require('./BestEffort');

class HotswapWiring {
  constructor({ servers, hotswap, settingsDb }) {
    this._servers = servers;
    this._hotswap = hotswap;
    this._settingsDb = settingsDb;
  }

  wire() {
    for (const item of PlacementLayout.ITEM_KEYS) {
      BestEffort.read(() => this._register(PlacementLayout.ITEM_TO_SERVER[item], this._servers.runtimeServer(item)));
    }
    this.applyPools();
  }

  applyPools(layout) {
    BestEffort.read(() => {
      const current = layout || PlacementStore.load(this._settingsDb);
      this._hotswap.configure(PlacementLayout.hotswapPools(current));
    });
  }

  _register(serverId, server) {
    if (!server || typeof server.stop !== 'function') return;
    this._hotswap.register(serverId, {
      stop: () => server.stop(),
      getState: () => HotswapWiring._stateOf(server),
    });
  }

  static _stateOf(server) {
    try { return server.getStatus().state; } catch (_) { return 'idle'; }
  }
}

module.exports = HotswapWiring;

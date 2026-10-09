'use strict';

class CliConnectLib {
  constructor(discovery, connector) {
    this._discovery = discovery;
    this._connector = connector;
  }

  static load() {
    const AppDiscovery = require('../lib/connect/AppDiscovery');
    const BridgeConnector = require('../lib/connect/BridgeConnector');
    return new CliConnectLib(new AppDiscovery(), BridgeConnector);
  }

  discover(o) {
    return this._discovery.discover(o);
  }

  openBridge(target) {
    return this._connector.open(target);
  }
}

module.exports = CliConnectLib;

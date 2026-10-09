class SharingPorts {
  constructor({ getApiPort, hostService, rpcLending }) {
    this._getApiPort = getApiPort;
    this._host = hostService;
    this._rpc = rpcLending;
  }

  getter() {
    return () => this.list();
  }

  list() {
    const ports = [this._getApiPort(), this._host.getTlsPort(), this._host.getWebPort()];
    const range = this._rpc.getPortRange();
    for (let p = range.start; p <= range.end; p++) ports.push(p);
    return ports.filter((p) => Number.isInteger(p) && p > 0);
  }
}

module.exports = SharingPorts;

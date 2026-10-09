class CdpDomain {
  constructor(server) {
    this._server = server;
  }

  handlers() {
    throw new Error(`${this.constructor.name} must implement handlers()`);
  }
}

module.exports = CdpDomain;

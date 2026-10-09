const SharedGpuLease = require('../SharedGpuLease');
const RouteReply = require('./RouteReply');

class GpuLendRoutes {
  constructor(service, auth) {
    this._lease = new SharedGpuLease(service);
    this._auth = auth;
  }

  mount(router) {
    const guards = [this._auth.requireToken, (req, res, next) => this._requireGpuShare(req, res, next)];
    router.post('/rpc/acquire', ...guards, async (req, res) => {
      RouteReply.send(res, await this._lease.acquire(req.sharingToken, req.body || {}, req.socket && req.socket.localAddress));
    });
    router.post('/rpc/heartbeat', ...guards, (req, res) => RouteReply.send(res, this._lease.heartbeat(req.sharingToken)));
    router.post('/rpc/release', ...guards, async (req, res) => RouteReply.send(res, await this._lease.release(req.sharingToken)));
  }

  _requireGpuShare(req, res, next) {
    const refusal = this._lease.gate();
    return refusal ? RouteReply.send(res, refusal) : next();
  }
}

module.exports = GpuLendRoutes;

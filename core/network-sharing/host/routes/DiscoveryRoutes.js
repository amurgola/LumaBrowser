const IpClass = require('../../../shared/net/IpClass');
const PinPairing = require('../PinPairing');
const RouteReply = require('./RouteReply');

class DiscoveryRoutes {
  constructor(service, auth) {
    this._service = service;
    this._auth = auth;
  }

  mount(router) {
    router.get('/info', (req, res) => res.json(this._service.getInfo()));
    router.post('/pair', this._auth.requireEnabled, (req, res) => this._pair(req, res));
    router.get('/resources', this._auth.requireToken, async (req, res) => res.json(await this._service.buildManifest()));
  }

  _pair(req, res) {
    const { pin, peerHint } = req.body || {};
    const result = this._service.pair(pin, { ip: IpClass.clientIp(req), peerHint });
    return RouteReply.send(res, PinPairing.toReply(result));
  }
}

module.exports = DiscoveryRoutes;

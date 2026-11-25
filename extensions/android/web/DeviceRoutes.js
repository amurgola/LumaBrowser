const path = require('path');
const AppModules = require('../AppModules');

class DeviceRoutes {
  static PAGE_FOLDER = path.join(__dirname, '..', 'ui', 'page');

  static create(context) {
    return new DeviceRoutes(context)._build();
  }

  constructor(context) {
    this._api = context.extensionApi;
    this._gateway = context.gateway;
  }

  _build() {
    this._publishGateway();
    const express = AppModules.load('express');
    const router = express.Router();
    router.use(express.json());
    router.get('/devices', (req, res) => this._answer(res, () => this._api.devices.overview()));
    router.post('/devices/:name/start', (req, res) => this._answer(res, () => this._api.devices.start(req.params.name)));
    router.post('/devices/:name/stop', (req, res) => this._answer(res, () => this._api.devices.stop(req.params.name)));
    router.post('/viewer-token', (req, res) => this._answer(res, () => this._ticket(req.body)));
    router.use(express.static(DeviceRoutes.PAGE_FOLDER, {
      etag: false, lastModified: false, cacheControl: false, setHeaders: (res) => res.set('Cache-Control', 'no-store'),
    }));
    return router;
  }

  _publishGateway() {
    const gateway = this._gateway;
    if (!gateway) return;
    if (gateway.baseUrl) this._api.gatewayInfo.baseUrl = gateway.baseUrl;
    if (typeof gateway.registerUpgrade === 'function') {
      gateway.registerUpgrade('/ws', (req, socket, head) => this._api.viewerSocket.handleUpgrade(req, socket, head));
    }
  }

  async _ticket(body) {
    const deviceName = String((body && body.device) || '');
    const { devices } = await this._api.devices.overview();
    if (!devices.some((device) => device.name === deviceName)) throw new Error(`There is no device named ${deviceName}`);
    return { token: this._api.tokens.issue(deviceName) };
  }

  async _answer(res, work) {
    try {
      res.json({ success: true, data: await work() });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
}

module.exports = DeviceRoutes;

const { ipcMain } = require('electron');
const IpcEnvelope = require('../shared/ipc/IpcEnvelope');
const SenderStream = require('../shared/ipc/SenderStream');

class PlacementIpcHandlers {
  static TEST_EVENT_CHANNEL = 'core.placement.testEvent';

  constructor(placementService) {
    this._svc = placementService;
  }

  register() {
    const svc = this._svc;
    this._handle('core.placement.isAvailable', () => ({ available: svc.isAvailable() }), { available: false });
    this._handle('core.placement.getConfig', () => ({ config: svc.getConfig() }));
    this._handle('core.placement.setConfig', (_e, patch) => ({ config: svc.setConfig(patch || {}) }));
    this._handle('core.placement.autoArrange', () => ({ config: svc.autoArrange() }));
    this._handle('core.placement.getMeasured', () => ({ measured: svc.getMeasured() }));
    this._handle('core.placement.getVramSnapshot', async () => ({ snapshot: await svc.getVramSnapshot() }));
    this._handle('core.placement.getHotswapInfo', async () => ({ info: await svc.getHotswapInfo() }));
    this._handle('core.placement.start', () => svc.startAll());
    this._handle('core.placement.stop', () => svc.stopAll());
    this._handle('core.placement.runTest', (event) => this._runTest(event));
  }

  async _runTest(event) {
    const send = SenderStream.create(event, PlacementIpcHandlers.TEST_EVENT_CHANNEL);
    try {
      return await this._svc.runTest(send);
    } catch (err) {
      send('error', { message: err.message });
      throw err;
    }
  }

  _handle(channel, fn, failureFields = {}) {
    const handler = IpcEnvelope.enveloped(fn);
    ipcMain.handle(channel, async (...args) => ({ ...failureFields, ...(await handler(...args)) }));
  }
}

module.exports = PlacementIpcHandlers;

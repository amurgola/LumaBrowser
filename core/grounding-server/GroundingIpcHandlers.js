const { ipcMain } = require('electron');
const IpcEnvelope = require('../shared/ipc/IpcEnvelope');
const PathPicker = require('../shared/ipc/PathPicker');
const SenderStream = require('../shared/ipc/SenderStream');
const GroundingModelSelection = require('./GroundingModelSelection');

class GroundingIpcHandlers {
  static EVENT_CHANNEL = 'core.groundingServer.event';
  static DOWNLOAD_SCOPE = 'grounding-model';

  static register({ groundingServerService: svc, llmService }) {
    const selection = (event) => new GroundingModelSelection({
      groundingServerService: svc,
      llmService,
      pickPath: (dialogOptions) => PathPicker.pick(event, dialogOptions),
    });
    GroundingIpcHandlers._handle('getView', () => svc.getView());
    GroundingIpcHandlers._handle('setModel', (event, sel) => selection(event).setModel(sel));
    GroundingIpcHandlers._handle('pickModel', (event) => selection(event).pickModel());
    GroundingIpcHandlers._handle('downloadRecommended', (event, id) => selection(event).downloadRecommended(id,
      SenderStream.create(event, GroundingIpcHandlers.EVENT_CHANNEL, { scope: GroundingIpcHandlers.DOWNLOAD_SCOPE, id })));
    GroundingIpcHandlers._handle('cancelDownload', () => svc.cancelDownload());
    GroundingIpcHandlers._handle('setAutoUnload', (_e, ms) => { svc.setAutoUnloadMs(ms); });
    GroundingIpcHandlers._handle('start', () => svc.ensureRunning());
    GroundingIpcHandlers._handle('stop', async () => { await svc.stop(); });
  }

  static _handle(name, fn) {
    ipcMain.handle(`core.groundingServer.${name}`, IpcEnvelope.enveloped(fn));
  }
}

module.exports = GroundingIpcHandlers;

const { ipcMain, webContents } = require('electron');
const IpcEnvelope = require('../shared/ipc/IpcEnvelope');
const SenderStream = require('../shared/ipc/SenderStream');
const VideoRouter = require('./VideoRouter');
const ImageGenerationRequests = require('./ipc/ImageGenerationRequests');

class VideoIpcHandlers {
  static SERVER_EVENT_CHANNEL = 'core.videoGen.serverEvent';
  static VIDEO_EVENT_CHANNEL = 'core.videoGen.videoEvent';

  static register(service, { notify } = {}) {
    const router = new VideoRouter({ imageServerService: service, notify });
    const generations = new ImageGenerationRequests(router);
    VideoIpcHandlers._wireServerEvents(service.videoRuntimeServer);
    VideoIpcHandlers._registerSlot(service.videoRuntimeServer);
    VideoIpcHandlers._registerGeneration(router, generations);
    return { router };
  }

  static _registerSlot(videoServer) {
    VideoIpcHandlers._handle('getServerStatus', IpcEnvelope.raw(() => VideoIpcHandlers._status(videoServer)));
    VideoIpcHandlers._handle('stopServer', IpcEnvelope.enveloped(async () => ({ status: await videoServer.stop() })));
  }

  static _registerGeneration(router, generations) {
    VideoIpcHandlers._handle('generate', IpcEnvelope.enveloped((event, args = {}) =>
      generations.generate(args, SenderStream.create(event, VideoIpcHandlers.VIDEO_EVENT_CHANNEL, { requestId: args.requestId }))));
    VideoIpcHandlers._handle('generateAbort', IpcEnvelope.enveloped(() => router.abort()));
  }

  static _wireServerEvents(videoServer) {
    videoServer.on('state-change', (e) => VideoIpcHandlers._broadcast('state-change', e));
    videoServer.on('log', (e) => VideoIpcHandlers._broadcast('log', e));
  }

  static _broadcast(type, payload) {
    for (const wc of webContents.getAllWebContents()) {
      try {
        if (!wc.isDestroyed()) wc.send(VideoIpcHandlers.SERVER_EVENT_CHANNEL, { type, payload });
      } catch (_) {}
    }
  }

  static _status(videoServer) {
    try {
      return videoServer.getStatus();
    } catch (err) {
      return { state: 'idle', error: err.message };
    }
  }

  static _handle(name, handler) {
    ipcMain.handle(`core.videoGen.${name}`, handler);
  }
}

module.exports = VideoIpcHandlers;

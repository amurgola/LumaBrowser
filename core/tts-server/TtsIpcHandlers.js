const { ipcMain } = require('electron');
const IpcEnvelope = require('../shared/ipc/IpcEnvelope');
const SenderStream = require('../shared/ipc/SenderStream');
const VoiceChannels = require('../shared/ipc/VoiceChannels');
const SherpaRuntimeInstaller = require('./runtimes/SherpaRuntimeInstaller');
const TtsSynthesisStreams = require('./TtsSynthesisStreams');

class TtsIpcHandlers {
  static register(service) {
    const streams = new TtsSynthesisStreams(service);
    const progress = (event, scope, id) => SenderStream.create(event, VoiceChannels.VOICE_EVENT_CHANNEL, { scope, id });

    ipcMain.handle('core.voiceServer.tts.getView', IpcEnvelope.enveloped(() => service.getView()));

    ipcMain.handle('core.voiceServer.tts.installRuntime', TtsIpcHandlers._withErrorFields(['code', 'detail'], (event) =>
      new SherpaRuntimeInstaller().install({
        runtimesRoot: service.getRuntimesDir(),
        onEvent: progress(event, 'tts-runtime', 'tts-sherpa'),
      })));

    ipcMain.handle('core.voiceServer.tts.downloadModel', IpcEnvelope.enveloped((event, id) =>
      service.downloadModel(id, progress(event, 'tts-model', id))));

    ipcMain.handle('core.voiceServer.tts.cancelDownload', IpcEnvelope.enveloped(() => ({ canceled: service.cancelDownload() })));

    ipcMain.handle('core.voiceServer.tts.setDefaults', IpcEnvelope.enveloped((_event, patch = {}) => {
      if (patch.modelId != null) service.setDefaultModelId(patch.modelId);
      if (patch.sid != null) service.setSid(patch.sid);
      if (patch.speed != null) service.setSpeed(patch.speed);
    }));

    ipcMain.handle('core.voiceServer.tts.prewarm', TtsIpcHandlers._withErrorFields(['code'], () => service.ensureRunning()));

    ipcMain.handle('core.voiceServer.tts.stop', IpcEnvelope.enveloped(async () => { await service.stop(); }));

    ipcMain.handle('core.voiceServer.synthesize', TtsIpcHandlers._withErrorFields(['code'], (event, args) => streams.start(event, args)));

    ipcMain.handle('core.voiceServer.ttsAbort', IpcEnvelope.enveloped((_event, requestId) => streams.abort(requestId)));
  }

  static _withErrorFields(fields, fn) {
    const handler = IpcEnvelope.enveloped(fn);
    return async (...args) => {
      const reply = await handler(...args);
      if (reply.success) return reply;
      for (const field of fields) if (reply[field] === undefined) reply[field] = null;
      return reply;
    };
  }
}

module.exports = TtsIpcHandlers;

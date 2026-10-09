const { ipcMain, systemPreferences, shell } = require('electron');
const IpcEnvelope = require('../shared/ipc/IpcEnvelope');
const SenderStream = require('../shared/ipc/SenderStream');
const VoiceChannels = require('../shared/ipc/VoiceChannels');
const RuntimeInstaller = require('../shared/runtime/RuntimeInstaller');
const SherpaRuntimeInstaller = require('../tts-server/runtimes/SherpaRuntimeInstaller');
const WhisperRuntimeCatalog = require('./runtimes/WhisperRuntimeCatalog');
const WhisperServerService = require('./WhisperServerService');

class WhisperIpcHandlers {
  static PRIVACY_SETTINGS_URLS = {
    win32: 'ms-settings:privacy-microphone',
    darwin: 'x-apple.systempreferences:com.apple.preference.security?Privacy_Microphone',
  };

  static NO_PRIVACY_PANEL_ERROR = 'No microphone privacy panel on this platform';

  static register(service, { platform = process.platform } = {}) {
    const installer = WhisperIpcHandlers._createInstaller();
    const progress = (event, scope, id) => SenderStream.create(event, VoiceChannels.VOICE_EVENT_CHANNEL, { scope, id });

    ipcMain.handle('core.voiceServer.stt.getView', IpcEnvelope.enveloped(() => service.getView()));

    ipcMain.handle('core.voiceServer.stt.installRuntime', WhisperIpcHandlers._withErrorFields(['code', 'detail'], (event, id) =>
      WhisperIpcHandlers._installRuntime(installer, id, {
        runtimesRoot: service.getRuntimesDir(),
        onEvent: progress(event, 'stt-runtime', id),
      })));

    ipcMain.handle('core.voiceServer.stt.downloadModel', IpcEnvelope.enveloped((event, id) =>
      service.downloadModel(id, progress(event, 'stt-model', id))));

    ipcMain.handle('core.voiceServer.stt.cancelDownload', IpcEnvelope.enveloped(() => ({ canceled: service.cancelDownload() })));

    ipcMain.handle('core.voiceServer.stt.setDefaultModel', IpcEnvelope.enveloped((_event, modelPath) => {
      service.setDefaultModelPath(modelPath);
    }));

    ipcMain.handle('core.voiceServer.stt.setLanguage', IpcEnvelope.enveloped((_event, language) => {
      service.setLanguage(language);
    }));

    ipcMain.handle('core.voiceServer.stt.prewarm', WhisperIpcHandlers._withErrorFields(['code'], () => service.ensureRunning()));

    ipcMain.handle('core.voiceServer.stt.stop', IpcEnvelope.enveloped(async () => { await service.stop(); }));

    ipcMain.handle('core.voiceServer.micAccessStatus', IpcEnvelope.enveloped(async () =>
      ({ status: await WhisperIpcHandlers._micAccessStatus(platform) })));

    ipcMain.handle('core.voiceServer.openMicPrivacySettings', IpcEnvelope.enveloped(() =>
      WhisperIpcHandlers._openPrivacySettings(platform)));

    ipcMain.handle('core.voiceServer.transcribe', WhisperIpcHandlers._withErrorFields(['code'], (_event, args = {}) =>
      service.transcribe(WhisperIpcHandlers.toAudioBuffer(args.wav), { language: args.language })));
  }

  static toAudioBuffer(wav) {
    if (typeof wav === 'string') return Buffer.from(wav, 'base64');
    if (wav instanceof ArrayBuffer) return Buffer.from(wav);
    if (ArrayBuffer.isView(wav)) return Buffer.from(wav.buffer, wav.byteOffset, wav.byteLength);
    return wav;
  }

  static _createInstaller() {
    return new RuntimeInstaller({
      catalog: new WhisperRuntimeCatalog(),
      userAgent: 'LumaBrowser-VoiceSetup',
      expectedKind: 'stt-inference',
      kindNoun: 'speech-to-text',
    });
  }

  static _installRuntime(installer, id, options) {
    if (id === WhisperServerService.SHERPA_RUNTIME_ID) return new SherpaRuntimeInstaller().install(options);
    return installer.installRuntime(id, options);
  }

  static async _micAccessStatus(platform) {
    if (platform === 'darwin') {
      const status = systemPreferences.getMediaAccessStatus('microphone');
      if (status !== 'not-determined') return status;
      return (await systemPreferences.askForMediaAccess('microphone')) ? 'granted' : 'denied';
    }
    if (platform === 'win32') return systemPreferences.getMediaAccessStatus('microphone');
    return 'granted';
  }

  static async _openPrivacySettings(platform) {
    const url = WhisperIpcHandlers.PRIVACY_SETTINGS_URLS[platform];
    if (!url) return { success: false, error: WhisperIpcHandlers.NO_PRIVACY_PANEL_ERROR };
    await shell.openExternal(url);
    return { success: true };
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

module.exports = WhisperIpcHandlers;

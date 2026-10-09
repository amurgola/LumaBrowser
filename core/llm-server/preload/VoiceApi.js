const PreloadSection = require('./PreloadSection');
const VoiceChannels = require('../../shared/ipc/VoiceChannels');

class VoiceApi extends PreloadSection {
  static build(ipcRenderer) {
    return {
      voice: {
        transcribe: (wav, opts) =>
          ipcRenderer.invoke('core.voiceServer.transcribe', { wav, ...(opts || {}) }),
        synthesize: (args) => ipcRenderer.invoke('core.voiceServer.synthesize', args || {}),
        synthesizeAbort: (requestId) => ipcRenderer.invoke('core.voiceServer.ttsAbort', requestId),
        micAccessStatus: () => ipcRenderer.invoke('core.voiceServer.micAccessStatus'),
        openMicPrivacySettings: () => ipcRenderer.invoke('core.voiceServer.openMicPrivacySettings'),
        stt: VoiceApi._stt(ipcRenderer),
        tts: VoiceApi._tts(ipcRenderer),
        onVoiceEvent: PreloadSection.subscribe(ipcRenderer, VoiceChannels.VOICE_EVENT_CHANNEL),
        onTtsEvent: PreloadSection.subscribe(ipcRenderer, VoiceChannels.TTS_STREAM_CHANNEL),
      },
    };
  }

  static _stt(ipcRenderer) {
    return {
      getView: () => ipcRenderer.invoke('core.voiceServer.stt.getView'),
      installRuntime: (id) => ipcRenderer.invoke('core.voiceServer.stt.installRuntime', id),
      downloadModel: (id) => ipcRenderer.invoke('core.voiceServer.stt.downloadModel', id),
      cancelDownload: () => ipcRenderer.invoke('core.voiceServer.stt.cancelDownload'),
      setDefaultModel: (p) => ipcRenderer.invoke('core.voiceServer.stt.setDefaultModel', p),
      setLanguage: (l) => ipcRenderer.invoke('core.voiceServer.stt.setLanguage', l),
      prewarm: () => ipcRenderer.invoke('core.voiceServer.stt.prewarm'),
      stop: () => ipcRenderer.invoke('core.voiceServer.stt.stop'),
    };
  }

  static _tts(ipcRenderer) {
    return {
      getView: () => ipcRenderer.invoke('core.voiceServer.tts.getView'),
      installRuntime: () => ipcRenderer.invoke('core.voiceServer.tts.installRuntime'),
      downloadModel: (id) => ipcRenderer.invoke('core.voiceServer.tts.downloadModel', id),
      cancelDownload: () => ipcRenderer.invoke('core.voiceServer.tts.cancelDownload'),
      setDefaults: (patch) => ipcRenderer.invoke('core.voiceServer.tts.setDefaults', patch),
      prewarm: () => ipcRenderer.invoke('core.voiceServer.tts.prewarm'),
      stop: () => ipcRenderer.invoke('core.voiceServer.tts.stop'),
    };
  }
}

module.exports = VoiceApi;

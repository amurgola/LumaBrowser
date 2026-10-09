const IpcSubscription = require('../../shared/ipc/IpcSubscription');
const VoiceChannels = require('../../shared/ipc/VoiceChannels');

class OnDemandPreloadApi {
  static GLOBAL_NAME = 'onDemandAPI';

  static expose(contextBridge, ipcRenderer) {
    contextBridge.exposeInMainWorld(OnDemandPreloadApi.GLOBAL_NAME, OnDemandPreloadApi.build(ipcRenderer));
  }

  static build(ipcRenderer) {
    return {
      ...OnDemandPreloadApi._lifecycle(ipcRenderer),
      ...OnDemandPreloadApi._conversation(ipcRenderer),
      voice: OnDemandPreloadApi._voice(ipcRenderer),
    };
  }

  static _lifecycle(ipcRenderer) {
    return {
      ready: () => ipcRenderer.send('on-demand:ready'),
      drag: (dx, dy) => ipcRenderer.send('on-demand:drag', { dx, dy }),
      dragEnd: () => ipcRenderer.send('on-demand:drag-end'),
      setExpanded: (expanded) => ipcRenderer.send('on-demand:set-expanded', { expanded: !!expanded }),
      getState: () => ipcRenderer.invoke('on-demand:get-state'),
      onState: IpcSubscription.of(ipcRenderer, 'on-demand:state'),
    };
  }

  static _conversation(ipcRenderer) {
    return {
      send: (args) => ipcRenderer.invoke('on-demand:send', args || {}),
      abort: () => ipcRenderer.invoke('on-demand:abort'),
      history: () => ipcRenderer.invoke('on-demand:history'),
      onChatEvent: IpcSubscription.of(ipcRenderer, 'on-demand:chat-event'),
    };
  }

  static _voice(ipcRenderer) {
    return {
      transcribe: (wav, opts) => ipcRenderer.invoke('core.voiceServer.transcribe', { wav, ...(opts || {}) }),
      synthesize: (args) => ipcRenderer.invoke('core.voiceServer.synthesize', args || {}),
      synthesizeAbort: (requestId) => ipcRenderer.invoke('core.voiceServer.ttsAbort', requestId),
      micAccessStatus: () => ipcRenderer.invoke('core.voiceServer.micAccessStatus'),
      sttPrewarm: () => ipcRenderer.invoke('core.voiceServer.stt.prewarm'),
      ttsPrewarm: () => ipcRenderer.invoke('core.voiceServer.tts.prewarm'),
      onTtsEvent: IpcSubscription.of(ipcRenderer, VoiceChannels.TTS_STREAM_CHANNEL),
    };
  }
}

module.exports = OnDemandPreloadApi;

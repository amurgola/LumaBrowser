import VoiceDownloadProgress from './VoiceDownloadProgress.js';

export default class VoiceSetupRows {
  static FALLBACK_STT = { id: 'parakeet-tdt-0.6b-v3', name: 'Parakeet v3', sizeBytes: 465 * 1024 * 1024 };
  static FALLBACK_TTS = { id: 'kokoro-int8-multi-lang-v1_1', name: 'Kokoro', sizeBytes: 320 * 1024 * 1024 };
  static STT_DONE = { runtimeReady: true, models: [1] };

  constructor(api) {
    this._api = api;
  }

  async render(rows, note, views, purpose) {
    const ttsOnly = purpose === 'read';
    const loaded = await this._views(views, ttsOnly);
    if (!loaded) { note.textContent = 'Could not read voice setup state.'; return; }
    const { stt, tts } = loaded;
    rows.innerHTML = '';
    const items = this.missingItems(stt, tts, ttsOnly);
    if (!tts.platformSupported) note.textContent = 'Text-to-speech has no prebuilt engine for this platform yet.';
    if (!items.length) { note.textContent = VoiceSetupRows._readyText(ttsOnly, false); return; }
    if (this._api.voice.remote === true) { this._renderRemote(rows, note, items, stt, tts); return; }
    this._renderInstall(rows, note, items, ttsOnly);
  }

  missingItems(stt, tts, ttsOnly) {
    const voice = this._api.voice;
    const mb = (b) => Math.round((b || 0) / (1024 * 1024));
    const items = [];
    const sttEngine = stt.defaultEngine || 'sherpa';
    const sttNeedsSherpa = !ttsOnly && !stt.runtimeReady && sttEngine === 'sherpa';
    const ttsNeedsSherpa = tts.platformSupported && !tts.runtimeReady;
    if (!stt.runtimeReady && sttEngine === 'whisper') {
      items.push({ label: 'Speech recognition engine (whisper.cpp)', run: () => voice.stt.installRuntime(stt.recommendedRuntimeId || 'whisper-cpp-cpu') });
    }
    if (sttNeedsSherpa || ttsNeedsSherpa) {
      items.push({ label: 'Speech engine (sherpa-onnx, ~20 MB)', run: () => voice.tts.installRuntime() });
    } else if (!ttsOnly && tts.runtimeOutdated) {
      items.push({ label: 'Speech engine update (sherpa-onnx ' + (tts.runtimePinnedVersion || '') + ')', run: () => voice.tts.installRuntime() });
    }
    if (!(stt.models || []).length) {
      const want = VoiceSetupRows._recommended(stt, VoiceSetupRows.FALLBACK_STT);
      items.push({ label: 'Speech recognition model (' + want.name + ', ~' + mb(want.sizeBytes) + ' MB)', run: () => voice.stt.downloadModel(want.id) });
    }
    if (!(tts.models || []).length) {
      const want = VoiceSetupRows._recommended(tts, VoiceSetupRows.FALLBACK_TTS);
      items.push({ label: 'Voice (' + want.name + ', ~' + mb(want.sizeBytes) + ' MB)', run: () => voice.tts.downloadModel(want.id) });
    }
    return items;
  }

  async _views(views, ttsOnly) {
    let stt = ttsOnly ? VoiceSetupRows.STT_DONE : (views && views.stt);
    let tts = views && views.tts;
    if (stt && tts) return { stt, tts };
    try {
      [stt, tts] = await Promise.all([ttsOnly ? VoiceSetupRows.STT_DONE : this._api.voice.stt.getView(), this._api.voice.tts.getView()]);
      return { stt, tts };
    } catch (_) {
      return null;
    }
  }

  _renderRemote(rows, note, items, stt, tts) {
    rows.appendChild(VoiceSetupRows._list(items));
    note.textContent = stt.shared === false || tts.shared === false
      ? 'The host is not sharing voice. Turn on "Voice" under Settings, Network Sharing, on the host computer.'
      : 'Not installed on the host yet. Open the chat on the host computer and click its microphone to download these, then try again here.';
  }

  _renderInstall(rows, note, items, ttsOnly) {
    const button = document.createElement('button');
    button.className = 'cm-voice-install';
    button.textContent = 'Download & set up (' + items.length + (items.length === 1 ? ' item)' : ' items)');
    rows.appendChild(VoiceSetupRows._list(items));
    rows.appendChild(button);
    button.addEventListener('click', () => this._install(button, note, items, ttsOnly));
  }

  async _install(button, note, items, ttsOnly) {
    button.disabled = true;
    const unsubscribe = VoiceDownloadProgress.listen(this._api, note, {
      label: (evt) => (evt.payload && evt.payload.pkg) || evt.id || '',
    });
    try {
      for (const item of items) {
        note.textContent = item.label + '…';
        const r = await item.run();
        if (!r || r.success === false) {
          note.textContent = 'Failed: ' + ((r && r.error) || item.label);
          button.disabled = false;
          return;
        }
      }
      note.textContent = VoiceSetupRows._readyText(ttsOnly, true);
      button.remove();
    } finally {
      if (unsubscribe) unsubscribe();
    }
  }

  static _readyText(ttsOnly, justInstalled) {
    if (ttsOnly) return 'Ready: click play again to hear the reply.';
    return justInstalled ? 'Voice is ready: click the microphone to start talking.' : 'Voice is ready: click the microphone again to start.';
  }

  static _recommended(view, fallback) {
    return (view.modelCatalog || []).find((m) => m.id === view.recommendedModelId) || fallback;
  }

  static _list(items) {
    const list = document.createElement('ul');
    list.className = 'cm-voice-list';
    for (const item of items) {
      const li = document.createElement('li');
      li.textContent = item.label;
      list.appendChild(li);
    }
    return list;
  }
}

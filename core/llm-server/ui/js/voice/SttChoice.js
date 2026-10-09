import VoiceRadioRow from './VoiceRadioRow.js';
import VoiceDownloadProgress from './VoiceDownloadProgress.js';

export default class SttChoice {
  static SCOPES = ['stt-model', 'stt-runtime'];

  constructor(api) {
    this._api = api;
    this._switching = false;
  }

  async render(pop, note) {
    const wrap = pop.querySelector('.cm-voice-stt');
    if (!wrap || this._api.voice.remote === true) return;
    let view;
    try { view = await this._api.voice.stt.getView(); } catch (_) { return; }
    if (!view || !view.success || !pop.isConnected) return;
    const entries = view.modelCatalog || [];
    if (!entries.length) return;
    wrap.innerHTML = '<div class="cm-voice-sec">Speech recognition</div>';
    for (const entry of entries) wrap.appendChild(this._row(entry, view, note));
  }

  static installedFor(entry, view) {
    return (view.models || []).find((m) => m.id === entry.id || (entry.file && m.name === entry.file)) || null;
  }

  _row(entry, view, note) {
    const have = SttChoice.installedFor(entry, view);
    const parts = VoiceRadioRow.create({
      group: 'cm-voice-stt-sel',
      text: entry.name + (have ? '' : VoiceRadioRow.downloadSuffix(entry.sizeBytes)),
      checked: !!(have && view.defaultModelPath && have.path === view.defaultModelPath),
      title: VoiceRadioRow.tooltip(entry),
      onChange: () => this._pick(entry, have, view, note, parts.span),
    });
    return parts.row;
  }

  async _pick(entry, have, view, note, span) {
    if (this._switching) return;
    this._switching = true;
    const unsubscribe = VoiceDownloadProgress.listen(this._api, note, {
      accept: (evt) => SttChoice.SCOPES.includes(evt.scope),
      label: (evt) => (evt.payload && evt.payload.pkg) || entry.name,
    });
    try {
      await this._switchTo(entry, have, view, note, span);
    } finally {
      if (unsubscribe) unsubscribe();
      this._switching = false;
    }
  }

  async _switchTo(entry, have, view, note, span) {
    if (!(await this._ensureRuntime(entry, view, note))) return;
    const target = have || await this._download(entry, note, span);
    if (!target) return;
    if (target.path) await this._api.voice.stt.setDefaultModel(target.path);
    view.defaultModelPath = target.path;
    this._api.voice.stt.prewarm().catch(() => {});
    note.textContent = 'Recognition set to ' + entry.name + '.';
  }

  async _ensureRuntime(entry, view, note) {
    const sherpa = entry.engine === 'sherpa';
    if (sherpa ? view.sherpaRuntimeReady : view.whisperRuntimeReady) return true;
    note.textContent = 'Installing the speech engine…';
    const runtimeId = sherpa ? 'sherpa-onnx' : (view.recommendedWhisperRuntimeId || 'whisper-cpp-cpu');
    const r = await this._api.voice.stt.installRuntime(runtimeId);
    if (!r || r.success === false) { note.textContent = 'Engine install failed: ' + ((r && r.error) || 'unknown error'); return false; }
    if (sherpa) view.sherpaRuntimeReady = true;
    else view.whisperRuntimeReady = true;
    return true;
  }

  async _download(entry, note, span) {
    note.textContent = 'Downloading ' + entry.name + '…';
    const r = await this._api.voice.stt.downloadModel(entry.id);
    if (!r || r.success === false) { note.textContent = 'Download failed: ' + ((r && r.error) || 'unknown error'); return null; }
    span.textContent = entry.name;
    return { path: r.destPath || r.dir };
  }
}

import VoiceRadioRow from './VoiceRadioRow.js';
import VoiceDownloadProgress from './VoiceDownloadProgress.js';

export default class VoiceQualityChoice {
  static TIER_ORDER = { low: 0, fast: 1, medium: 2, high: 3 };

  constructor(api) {
    this._api = api;
    this._switching = false;
  }

  async render(pop, note) {
    const wrap = pop.querySelector('.cm-voice-quality');
    if (!wrap || this._api.voice.remote === true) return;
    let view;
    try { view = await this._api.voice.tts.getView(); } catch (_) { return; }
    if (!view || !view.success || !pop.isConnected) return;
    const all = view.modelCatalog || [];
    const tiers = VoiceQualityChoice.tiers(all);
    const external = all.filter((m) => m.external);
    if (!tiers.length && !external.length) return;
    const installed = new Set((view.models || []).map((m) => m.id));
    wrap.innerHTML = '<div class="cm-voice-sec">Voice quality</div>';
    for (const tier of tiers) wrap.appendChild(this._row(tier, VoiceQualityChoice._capitalized(tier.quality), view, installed, note));
    this._renderEngines(wrap, external, view, installed, note);
  }

  static tiers(catalog) {
    const order = VoiceQualityChoice.TIER_ORDER;
    return catalog.filter((m) => m.quality && !m.external).sort((a, b) => (order[a.quality] ?? 9) - (order[b.quality] ?? 9));
  }

  _renderEngines(wrap, external, view, installed, note) {
    const byEngine = new Map();
    for (const voice of external) {
      if (!byEngine.has(voice.engineId)) byEngine.set(voice.engineId, { name: voice.engineName || voice.engineId, voices: [] });
      byEngine.get(voice.engineId).voices.push(voice);
    }
    for (const [, group] of byEngine) {
      const section = document.createElement('div');
      section.className = 'cm-voice-sec';
      section.textContent = group.name + ' voices';
      wrap.appendChild(section);
      for (const voice of group.voices) {
        installed.add(voice.id);
        wrap.appendChild(this._row(voice, voice.quality === 'clone' ? 'Cloned' : (voice.quality || 'Voice'), view, installed, note));
      }
    }
  }

  _row(voice, caption, view, installed, note) {
    const parts = VoiceRadioRow.create({
      group: 'cm-voice-quality-sel',
      text: caption + ': ' + voice.name + (installed.has(voice.id) ? '' : VoiceRadioRow.downloadSuffix(voice.sizeBytes)),
      checked: view.defaultModelId === voice.id,
      title: VoiceRadioRow.tooltip(voice),
      onChange: () => this._pick(voice, caption, installed, note, parts.span),
    });
    return parts.row;
  }

  async _pick(voice, caption, installed, note, span) {
    if (this._switching) return;
    this._switching = true;
    try {
      if (!installed.has(voice.id) && !(await this._download(voice, caption, installed, note, span))) return;
      await this._api.voice.tts.setDefaults({ modelId: voice.id });
      this._api.voice.tts.prewarm().catch(() => {});
      note.textContent = 'Voice set to ' + voice.name + '.';
    } finally {
      this._switching = false;
    }
  }

  async _download(voice, caption, installed, note, span) {
    note.textContent = 'Downloading ' + voice.name + '…';
    const unsubscribe = VoiceDownloadProgress.listen(this._api, note, {
      accept: (evt) => evt.scope === 'tts-model',
      label: () => voice.name,
    });
    try {
      const r = await this._api.voice.tts.downloadModel(voice.id);
      if (!r || r.success === false) { note.textContent = 'Download failed: ' + ((r && r.error) || 'unknown error'); return false; }
      installed.add(voice.id);
      span.textContent = caption + ': ' + voice.name;
      return true;
    } finally {
      if (unsubscribe) unsubscribe();
    }
  }

  static _capitalized(word) {
    return word.charAt(0).toUpperCase() + word.slice(1);
  }
}

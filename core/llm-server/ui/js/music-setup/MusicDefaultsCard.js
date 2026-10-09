import HtmlEscaper from '../format/HtmlEscaper.js';
import Dom from '../dom/Dom.js';

export default class MusicDefaultsCard {
  static UNLOAD_OPTIONS = [[0, 'Never'], [5 * 60000, '5 min'], [10 * 60000, '10 min'], [30 * 60000, '30 min']];

  static DEFAULT_MAX_SEC = 300;

  constructor(panel) {
    this._panel = panel;
  }

  paint() {
    const body = Dom.byId('musicDefaultsBody');
    const view = this._panel.view;
    if (!body || !view) return;
    const installed = ((view.models && view.models.models) || []).filter((m) => m.installed);
    const runtime = this._panel.runtimeRow();
    const gate = { serverMissing: !(runtime && runtime.installed), modelMissing: !installed.length };
    gate.gated = gate.serverMissing || gate.modelMissing;
    this._paintPill(gate.gated, view.enabled);
    body.className = '';
    body.innerHTML = MusicDefaultsCard._html(view, installed, gate);
    this._wire();
  }

  _paintPill(gated, enabled) {
    const pill = Dom.byId('musicDefaultsPill');
    if (!pill) return;
    pill.className = 'luma-badge ' + (gated ? 'accent' : enabled ? 'ok' : 'accent');
    pill.textContent = gated ? 'Needs setup' : enabled ? 'Enabled' : 'Disabled';
  }

  static _gateNote(gate) {
    if (gate.serverMissing) return '<div class="music-gate-note">Install the SGLang-Omni server first. These settings unlock once it is installed and a model is downloaded.</div>';
    if (gate.modelMissing) return '<div class="music-gate-note">Download a music model first. These settings unlock once one is installed.</div>';
    return '';
  }

  static _html(view, installed, gate) {
    const esc = HtmlEscaper.escape;
    const d = view.defaults || {};
    const dis = gate.gated ? 'disabled' : '';
    const modelOptions = installed.map((m) => `<option value="${esc(m.id)}" ${d.modelId === m.id ? 'selected' : ''}>${esc(m.label)}</option>`).join('');
    const unloadOptions = MusicDefaultsCard.UNLOAD_OPTIONS
      .map(([ms, label]) => `<option value="${ms}" ${Number(d.autoUnloadMs) === ms ? 'selected' : ''}>${label}</option>`).join('');
    return `
      ${MusicDefaultsCard._gateNote(gate)}
      <div class="${gate.gated ? 'music-gated' : ''}">
        <div class="defaults-row"><label>Enable music generation</label>
          <input type="checkbox" id="musicEnabledChk" ${view.enabled ? 'checked' : ''} ${dis}></div>
        <div class="defaults-row"><label>Default model</label>
          <select id="musicModelSel" ${dis}>${modelOptions || '<option value="">No model downloaded yet</option>'}</select></div>
        <div class="defaults-row"><label>Seed <span class="luma-muted">(blank = random)</span></label>
          <input type="number" id="musicSeedInp" value="${d.seed != null ? Number(d.seed) : ''}" placeholder="random" ${dis}></div>
        <div class="defaults-row"><label>Max song length (sec)</label>
          <input type="number" id="musicMaxDurInp" value="${Number(d.maxDurationSec) || MusicDefaultsCard.DEFAULT_MAX_SEC}" min="30" max="300" ${dis}></div>
        <div class="defaults-row"><label>Unload after idle</label>
          <select id="musicUnloadSel" ${dis}>${unloadOptions}</select></div>
      </div>
    `;
  }

  _wire() {
    for (const id of ['musicModelSel', 'musicSeedInp', 'musicMaxDurInp', 'musicUnloadSel']) {
      const el = Dom.byId(id);
      if (el) el.addEventListener('change', () => this._save());
    }
    const enabled = Dom.byId('musicEnabledChk');
    if (enabled) enabled.addEventListener('change', async () => {
      await this._panel.api().setEnabled(enabled.checked);
      this._panel.view.enabled = enabled.checked;
      this.paint();
    });
  }

  async _save() {
    const seed = Dom.byId('musicSeedInp').value.trim();
    await this._panel.api().setDefaults({
      modelId: Dom.byId('musicModelSel').value || null,
      seed: seed === '' ? null : Number(seed),
      maxDurationSec: Number(Dom.byId('musicMaxDurInp').value) || MusicDefaultsCard.DEFAULT_MAX_SEC,
      autoUnloadMs: Number(Dom.byId('musicUnloadSel').value),
    });
  }
}

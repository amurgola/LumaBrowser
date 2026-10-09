import Dom from '../../dom/Dom.js';

export default class PlacementControls {
  static SNAPSHOT_REFRESH_MS = 1500;

  static MS_PER_MINUTE = 60000;

  constructor(view) {
    this._view = view;
  }

  render(body) {
    const model = this._view.model;
    const autoMin = Math.round((model.config.autoStopMs || 0) / PlacementControls.MS_PER_MINUTE);
    const row = Dom.el('div', 'adv-controls',
      '<button class="adv-btn primary" id="advSave">Save layout</button>'
      + '<button class="adv-btn" id="advStart"' + (model.canApply ? '' : ' disabled title="Run a test render first"') + '>Start all</button>'
      + '<button class="adv-btn" id="advStop">Stop all</button>'
      + '<label class="adv-field"><input type="checkbox" id="advAutoStart"' + (model.config.autoStart ? ' checked' : '') + '> Auto-start on launch</label>'
      + '<label class="adv-field">Auto-stop after <input type="number" id="advAutoStop" min="0" value="' + autoMin + '"> min idle (0 = never)</label>'
      + '<span class="adv-status" id="advStatus"></span>');
    body.appendChild(row);
    row.querySelector('#advSave').addEventListener('click', () => this.save(row));
    row.querySelector('#advStart').addEventListener('click', () => this.lifecycle('start'));
    row.querySelector('#advStop').addEventListener('click', () => this.lifecycle('stop'));
  }

  async save(row) {
    const api = this._view.placementApi();
    if (!api) return;
    this._view.status('Saving…');
    const payload = this._savePayload(row);
    try {
      const r = await api.setConfig(payload);
      if (r && r.success) this._saved(r.config);
      else this._view.status('Save failed: ' + ((r && r.error) || 'unknown'));
    } catch (e) { this._view.status('Save failed: ' + (e && e.message)); }
  }

  async autoArrange() {
    const api = this._view.placementApi();
    if (!api) return;
    this._view.status('Resetting to automatic…');
    try {
      const r = await api.autoArrange();
      if (r && r.success) {
        this._view.model.applyConfig(r.config);
        this._view.render();
        this._view.status('Reset to automatic placement.');
      }
    } catch (e) { this._view.status('Failed: ' + (e && e.message)); }
  }

  async lifecycle(which) {
    const api = this._view.placementApi();
    if (!api) return;
    this._view.status(which === 'start' ? 'Starting all servers…' : 'Stopping…');
    try {
      const r = which === 'start' ? await api.start() : await api.stop();
      this._view.status(PlacementControls._lifecycleText(which, r));
      setTimeout(() => this._view.refreshSnapshot(), PlacementControls.SNAPSHOT_REFRESH_MS);
    } catch (e) { this._view.status('Failed: ' + (e && e.message)); }
  }

  static _lifecycleText(which, r) {
    if (!(r && r.success)) return 'Failed: ' + ((r && r.error) || '');
    return which === 'start' ? 'Started.' : 'Stopped.';
  }

  _savePayload(row) {
    const autoStart = !!row.querySelector('#advAutoStart').checked;
    const autoStopMs = Math.max(0, Number(row.querySelector('#advAutoStop').value) || 0) * PlacementControls.MS_PER_MINUTE;
    return { layout: this._view.model.layout, autoStart, autoStopMs };
  }

  _saved(config) {
    this._view.model.applyConfig(config);
    this._view.render();
    this._view.status('Saved.' + (this._view.model.canApply ? '' : ' Run a test render to enable allocation.'));
  }
}

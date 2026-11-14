import Dom from '../../dom/Dom.js';
import HtmlEscaper from '../../format/HtmlEscaper.js';
import PlacementFit from './PlacementFit.js';
import PlacementLayoutModel from './PlacementLayoutModel.js';

export default class PlacementPreviewMode {
  static BANNER = 'Preview: not this PC';
  static NOTE = 'This is what automatic setup would choose on that PC. Sizes are the planner\'s estimates. Nothing here is saved or loaded.';
  static THIS_PC = 'This PC';

  constructor(view) {
    this._view = view;
    this._rigs = [];
    this._preview = null;
    this._real = null;
  }

  get active() {
    return !!this._preview;
  }

  async load() {
    const api = this._view.placementApi();
    if (!api || typeof api.previewRig !== 'function') return;
    try {
      const reply = await api.previewRig(null);
      this._rigs = (reply && reply.rigs) || [];
    } catch (_) { this._rigs = []; }
  }

  picker() {
    if (!this._rigs.length) return null;
    const row = Dom.el('div', 'adv-preview-rigs', '<span class="adv-lane-meta">Preview the automatic plan on</span>');
    row.appendChild(this._rigButton('', PlacementPreviewMode.THIS_PC));
    for (const rig of this._rigs) row.appendChild(this._rigButton(rig.id, rig.label));
    return row;
  }

  describe() {
    const esc = HtmlEscaper.escape;
    const box = Dom.el('div', 'adv-preview-banner',
      '<b>' + esc(PlacementPreviewMode.BANNER) + '</b> <span>' + esc(this._preview.rig.label) + '</span>'
      + '<div class="adv-preview-note">' + esc(PlacementPreviewMode.NOTE) + '</div>');
    const lines = Dom.el('ul', 'adv-preview-summary');
    for (const line of this._preview.summary || []) lines.appendChild(Dom.el('li', null, esc(line)));
    box.appendChild(lines);
    return box;
  }

  async show(rigId) {
    if (!rigId) { this.leave(); this._view.render(); return; }
    const preview = await this._fetch(rigId);
    if (!preview) { this._view.status('The preview could not be planned.'); return; }
    this._enter(preview);
    this._view.render();
  }

  leave() {
    if (!this._real) return;
    this._view.model = this._real.model;
    this._view.fit = this._real.fit;
    this._real = null;
    this._preview = null;
  }

  async _fetch(rigId) {
    try {
      const reply = await this._view.placementApi().previewRig(rigId);
      return (reply && reply.preview) || null;
    } catch (_) {
      return null;
    }
  }

  _enter(preview) {
    if (!this._real) this._real = { model: this._view.model, fit: this._view.fit };
    const model = new PlacementLayoutModel();
    model.applyConfig(preview.config);
    model.setSnapshot(preview.snapshot);
    this._view.model = model;
    this._view.fit = new PlacementFit(model);
    this._preview = preview;
  }

  _rigButton(rigId, label) {
    const current = this._preview ? this._preview.rig.id : '';
    const button = Dom.el('button', 'adv-mini' + (rigId === current ? ' sel' : ''), HtmlEscaper.escape(label));
    button.dataset.rig = rigId;
    button.onclick = () => this.show(rigId);
    return button;
  }
}

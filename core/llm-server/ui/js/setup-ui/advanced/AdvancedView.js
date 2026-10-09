import Dom from '../../dom/Dom.js';
import AdvancedStyles from './AdvancedStyles.js';
import AdvancedSubtabs from './AdvancedSubtabs.js';
import ChatDataWipe from './ChatDataWipe.js';
import LlmSplit from './LlmSplit.js';
import PlacementChips from './PlacementChips.js';
import PlacementControls from './PlacementControls.js';
import PlacementFit from './PlacementFit.js';
import PlacementLanes from './PlacementLanes.js';
import PlacementLayoutModel from './PlacementLayoutModel.js';
import PlacementRows from './PlacementRows.js';
import PromptPreviewPanel from './PromptPreviewPanel.js';
import SplitEditorPanel from './SplitEditorPanel.js';
import TestRenderPanel from './TestRenderPanel.js';
import DropTargets from './DropTargets.js';

export default class AdvancedView {
  static GRID_NOTE = 'Bars show planned VRAM from the last test render. A red bar means the placement overflows the card. '
    + 'Group order is fill order: the first card fills before the next takes any layers. '
    + 'A GPU that is missing or offline at launch is skipped as if it were not in the layout.';

  constructor({ api, doc = document, reload } = {}) {
    this._api = api;
    this._doc = doc;
    this.model = new PlacementLayoutModel();
    this.fit = new PlacementFit(this.model);
    this._subtabs = new AdvancedSubtabs(doc);
    this._wipe = new ChatDataWipe({ api, doc, reload });
    this._rows = new PlacementRows(this);
    this._lanes = new PlacementLanes(this);
    this._chips = new PlacementChips(this);
    this._splitPanel = new SplitEditorPanel(this);
    this._controls = new PlacementControls(this);
    this._test = new TestRenderPanel(this);
    this._prompt = new PromptPreviewPanel(() => this._api && this._api.chat);
  }

  init() {
    this._subtabs.wire(() => this._wipe.wire());
  }

  async open() {
    this.init();
    this._subtabs.apply(this._subtabs.current);
    const api = this.placementApi();
    if (!api) { this._showError('Placement API unavailable.'); return; }
    AdvancedStyles.inject(this._doc);
    this._wireAutoArrange();
    try {
      const [cfg, snap] = await Promise.all([api.getConfig(), api.getVramSnapshot()]);
      this.model.applyConfig(cfg && cfg.config);
      this.model.setSnapshot(snap && snap.snapshot);
      this.render();
    } catch (e) {
      this._showError('Failed to load: ' + (e && e.message));
    }
  }

  render() {
    const body = this._doc.getElementById('advBody');
    if (!body) return;
    body.className = '';
    body.innerHTML = '';
    this.model.ensureGpuResources();
    body.appendChild(this._rows.gate());
    body.appendChild(this._rows.contextRow());
    this._splitPanel.render(body);
    const tray = this._tray();
    body.appendChild(tray);
    body.appendChild(this._rows.combineRow());
    body.appendChild(Dom.el('div', 'adv-grid-note', AdvancedView.GRID_NOTE));
    body.appendChild(this._lanes.build());
    this._chips.distribute(body, tray);
    this._controls.render(body);
    this._test.render(body);
    this._prompt.render(body);
  }

  status(text) {
    const s = this._doc.getElementById('advStatus');
    if (s) s.textContent = text || '';
  }

  placementApi() {
    return (this._api && this._api.placement) || null;
  }

  artifactApi() {
    return (this._api && this._api.artifact) || null;
  }

  drop(itemKey, target) {
    const refusal = this.model.place(itemKey, target);
    this.render();
    if (refusal) this.status(refusal);
  }

  setContextSplit(enabled) {
    this.model.setContextSplit(enabled);
    this.render();
  }

  createGroup(devices) {
    if (devices.length >= 2) this.model.ensureGroup(devices);
    this.render();
  }

  ungroup(resId) {
    this.model.ungroup(resId);
    this.render();
  }

  reorder(resId, from, to) {
    if (this.model.reorderGroup(resId, from, to)) this.render();
  }

  addSingularity(resId) {
    this.model.addSingularity(resId);
    this.render();
  }

  removeSingularity(id) {
    this.model.removeSingularity(id);
    this.render();
  }

  openSplitEditor() {
    const editor = LlmSplit.open(this.model, this.fit);
    if (!editor) return;
    this.model.splitEditor = editor;
    this.render();
  }

  closeSplitEditor() {
    this.model.splitEditor = null;
    this.render();
  }

  applySplit() {
    const editor = this.model.splitEditor;
    if (!editor) return;
    const problem = LlmSplit.apply(this.model, editor);
    if (problem) { this.status(problem); return; }
    this.model.splitEditor = null;
    this.render();
    this.status(LlmSplit.APPLIED);
  }

  async refreshSnapshot() {
    const api = this.placementApi();
    if (!api) return;
    try {
      const r = await api.getVramSnapshot();
      if (r && r.success) {
        this.model.setSnapshot(r.snapshot);
        this.render();
      }
    } catch (_) {}
  }

  _tray() {
    const tray = Dom.el('div', 'adv-tray');
    tray.appendChild(Dom.el('div', 'adv-tray-label', 'Automatic: the coordinator places these'));
    DropTargets.wire(tray, { kind: 'auto' }, (itemKey, d) => this.drop(itemKey, d));
    return tray;
  }

  _wireAutoArrange() {
    const btn = this._doc.getElementById('advAutoArrange');
    if (!btn || btn.dataset.wired) return;
    btn.dataset.wired = '1';
    btn.addEventListener('click', () => this._controls.autoArrange());
  }

  _showError(text) {
    const body = this._doc.getElementById('advBody');
    if (!body) return;
    body.className = 'error';
    body.textContent = text;
  }
}

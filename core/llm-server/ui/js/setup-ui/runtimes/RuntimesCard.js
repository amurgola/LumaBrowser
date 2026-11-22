import FrameworkControls from '../frameworks/FrameworkControls.js';
import FrameworkFrameHtml from '../frameworks/FrameworkFrameHtml.js';
import FrameworksCardHtml from '../frameworks/FrameworksCardHtml.js';
import PeerGpusHint from '../defaults/PeerGpusHint.js';
import RamPinHint from '../defaults/RamPinHint.js';
import SaveNote from '../defaults/SaveNote.js';
import HostRuntimeAdvice from './HostRuntimeAdvice.js';
import RuntimeUpdateBadge from './RuntimeUpdateBadge.js';
import RuntimeRowProgress from './RuntimeRowProgress.js';
import SystemStatus from '../system/SystemStatus.js';

export default class RuntimesCard {
  constructor(ctx) {
    this._ctx = ctx;
    this._progress = new RuntimeRowProgress(ctx.doc);
    this._controls = new FrameworkControls(ctx, this);
    this._ramPinHint = new RamPinHint(ctx, ctx.prefs);
    this._saveNote = new SaveNote(ctx.doc, { noteId: 'runtimesSaveNote', bodyId: 'runtimesBody', pillId: 'runtimesPill' });
    this._view = null;
    this._paintedFrameworks = null;
  }

  async render() {
    const api = this._ctx.api;
    if (!api || !api.getRuntimesView) { this._error('llmDiagAPI.getRuntimesView is unavailable.'); return; }
    const res = await api.getRuntimesView();
    if (!res || !res.success) { this._error((res && res.error) || 'Failed to load runtimes'); return; }
    await Promise.all([this._ctx.frameworks.load(api), this._ctx.prefs.loadRamPin(api)]);
    this.renderView(res.view);
    this._ctx.cards.models.render();
    this.refreshUpdates();
  }

  renderView(view) {
    this._view = view;
    this._paintedFrameworks = JSON.stringify(this._ctx.frameworks.view);
    this._ctx.runtimes.setView(view);
    this._paintPill(view);
    this._paintBody(view);
    for (const r of view.runtimes) this._applyUpdate(r.id);
    this._markBuildUpdates();
    this._refreshHints();
    this.publishStatus();
  }

  repaint() {
    if (this._view) this.renderView(this._view);
  }

  async refreshFrameworks() {
    await this._ctx.frameworks.load(this._ctx.api);
    const changed = JSON.stringify(this._ctx.frameworks.view) !== this._paintedFrameworks;
    if (changed) this.repaint();
    return changed;
  }

  afterFrameworkSave(saved, serverStopped, selection) {
    this.repaint();
    if (!saved) return;
    const cards = this._ctx.cards;
    if (cards.defaults && this._ctx.lastDefaults) cards.defaults.renderView(this._ctx.lastDefaults);
    if (selection && cards.models) cards.models.render();
    this._saveNote.show(serverStopped);
  }

  async refreshUpdates() {
    const api = this._ctx.api;
    if (!api || !api.checkRuntimeUpdates) return;
    let res;
    try { res = await api.checkRuntimeUpdates(); } catch (_) { return; }
    if (!res || !res.success || !res.updates) return;
    for (const [id, info] of Object.entries(res.updates)) {
      this._ctx.runtimes.setUpdate(id, info);
      this._applyUpdate(id);
    }
    this._markBuildUpdates();
    this.publishStatus();
  }

  publishStatus() {
    if (!this._ctx.runtimes.all().length) return;
    const frameworks = this._ctx.frameworks;
    const current = frameworks.current();
    const servingId = current ? current.runtimeId : (this._ctx.lastDefaults && this._ctx.lastDefaults.runtimeId);
    const missing = current && !current.runtimeId && current.frameworkId ? frameworks.nameOf(current.frameworkId) : null;
    SystemStatus.emit(this._ctx.doc, 'runtimes', SystemStatus.runtimes(this._ctx.runtimes, servingId || null, missing));
  }

  _paintPill(view) {
    const pill = this._ctx.doc.getElementById('runtimesPill');
    pill.className = 'luma-badge accent';
    pill.textContent = FrameworksCardHtml.pillText(view);
  }

  _paintBody(view) {
    const ctx = this._ctx;
    const body = ctx.doc.getElementById('runtimesBody');
    body.className = '';
    body.innerHTML = FrameworksCardHtml.body(view, ctx.frameworks, {
      rows: ctx.rows,
      prefs: ctx.prefs,
      npuNames: ctx.hostCaps.intelNpuNames(),
      advice: HostRuntimeAdvice.forRows(view.runtimes, ctx.hostCaps),
    });
    this._controls.wire(body);
  }

  _markBuildUpdates() {
    const frames = [...this._ctx.doc.querySelectorAll('#runtimesBody [data-framework]')];
    for (const group of FrameworksCardHtml.groups((this._view && this._view.runtimes) || [])) {
      const frame = frames.find((el) => el.getAttribute('data-framework') === group.id);
      const meta = frame && frame.querySelector('[data-fw-builds-meta]');
      if (!meta) continue;
      const installed = group.rows.filter((row) => row.installed);
      const update = installed.some((row) => { const info = this._ctx.runtimes.update(row.id); return !!(info && info.updateAvailable); });
      meta.textContent = FrameworkFrameHtml.buildsMeta(installed.length, group.rows.length, update);
    }
  }

  _refreshHints() {
    const doc = this._ctx.doc;
    this._ramPinHint.refresh();
    if (doc.getElementById('peerGpusHint')) PeerGpusHint.fill(this._ctx.api, doc);
  }

  _applyUpdate(id) {
    const info = this._ctx.runtimes.update(id);
    if (info) RuntimeUpdateBadge.apply(this._progress.row(id), info, this._ctx.doc);
  }

  _error(text) {
    const body = this._ctx.doc.getElementById('runtimesBody');
    body.className = 'luma-error';
    body.textContent = text;
    SystemStatus.emit(this._ctx.doc, 'runtimes', SystemStatus.error(text));
  }
}

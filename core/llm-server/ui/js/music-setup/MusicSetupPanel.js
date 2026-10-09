import Dom from '../dom/Dom.js';
import HostPlatform from '../wizard/HostPlatform.js';
import MusicDefaultsCard from './MusicDefaultsCard.js';
import MusicInstallProgress from './MusicInstallProgress.js';
import MusicModelsCard from './MusicModelsCard.js';
import MusicRuntimeCard from './MusicRuntimeCard.js';
import MusicTryCard from './MusicTryCard.js';

export default class MusicSetupPanel {
  static NO_API = 'Music server is not available in this build.';

  static BODY_IDS = ['musicRuntimeBody', 'musicModelsBody', 'musicDefaultsBody', 'musicTryBody'];

  constructor(opts) {
    const options = opts || {};
    this._getRoot = options.getApi || (() => window.llmDiagAPI);
    this._getChatExt = options.getChatExt || (() => window.LumaChatExt);
    this.view = null;
    this.installProgress = null;
    this.activeDl = null;
    this.genState = null;
    this.runtimeCard = new MusicRuntimeCard(this);
    this.modelsCard = new MusicModelsCard(this);
    this.defaultsCard = new MusicDefaultsCard(this);
    this.tryCard = new MusicTryCard(this);
    this._booted = false;
  }

  hideNavIfUnsupported(nav) {
    if (!HostPlatform.isMacPlatform(nav)) return;
    const entry = Dom.byId('navMusic');
    if (entry) entry.hidden = true;
  }

  hasApi() {
    const root = this._getRoot();
    return !!(root && root.music && root.music.getView);
  }

  api() {
    return this._getRoot().music;
  }

  diagApi() {
    return this._getRoot();
  }

  chatExt() {
    return this._getChatExt();
  }

  async open() {
    if (!this.hasApi()) { this._paintNoApi(); return; }
    if (!this._booted) { this._booted = true; this._wireEvents(); }
    await this.refreshAll();
  }

  runtimeRow() {
    const runtimes = this.view && this.view.runtimes && this.view.runtimes.runtimes;
    return (runtimes && runtimes[0]) || null;
  }

  async refreshAll() {
    let view;
    try { view = await this.api().getView(); } catch (e) { view = { success: false, error: (e && e.message) || 'unavailable' }; }
    if (!view || view.success === false) { this._paintLoadError(view); return; }
    this.view = view;
    this._paintAll();
  }

  async refreshStatusOnly() {
    if (!this.view) return;
    try { this.view.status = await this.api().getStatus(); } catch (_) {}
    this.runtimeCard.paint();
    this.tryCard.paint();
  }

  _paintAll() {
    this.runtimeCard.paint();
    this.modelsCard.paint();
    this.defaultsCard.paint();
    this.tryCard.paint();
  }

  _paintNoApi() {
    for (const id of MusicSetupPanel.BODY_IDS) {
      const el = Dom.byId(id);
      if (el) { el.className = ''; el.textContent = MusicSetupPanel.NO_API; }
    }
  }

  _paintLoadError(view) {
    const el = Dom.byId('musicRuntimeBody');
    if (!el) return;
    el.className = '';
    el.textContent = `Could not load music setup: ${(view && view.error) || 'unknown error'}`;
  }

  _wireEvents() {
    const api = this.api();
    api.onRuntimeEvent((evt) => this._onRuntimeEvent(evt));
    api.onModelEvent((evt) => this._onModelEvent(evt));
    api.gen.onMusicEvent((evt) => this._onMusicEvent(evt));
    api.gen.onServerEvent((evt) => { if (evt && evt.type === 'state-change') this.refreshStatusOnly(); });
  }

  _onRuntimeEvent(evt) {
    if (!evt) return;
    this.installProgress = MusicInstallProgress.next(this.installProgress, evt.type, evt.payload);
    if (MusicInstallProgress.isTerminal(evt.type)) { this.refreshAll(); return; }
    this.runtimeCard.paint();
  }

  _onModelEvent(evt) {
    if (!evt) return;
    const { modelId, type, payload } = evt;
    if (type === 'start') {
      this.activeDl = { modelId, received: 0, total: (payload && payload.total) || 0 };
      this.modelsCard.paint();
    } else if (type === 'download') {
      if (this.activeDl) {
        this.activeDl.received = (payload && payload.received) || 0;
        this.activeDl.total = (payload && payload.total) || this.activeDl.total;
      }
      this.modelsCard.patchDownloadRow();
    } else if (type === 'finalize' || type === 'canceled' || type === 'error') {
      this.activeDl = type === 'error' ? { ...(this.activeDl || {}), error: payload && payload.message } : null;
      this.refreshAll();
    }
  }

  _onMusicEvent(evt) {
    const gen = this.genState;
    if (!evt || !gen || evt.requestId !== gen.requestId) return;
    const { type, payload } = evt;
    if (type === 'status') gen.phase = payload && payload.phase;
    else if (type === 'progress') gen.elapsedMs = payload && payload.elapsedMs;
    else if (type === 'error') { gen.phase = 'error'; gen.error = payload && payload.message; }
    this.tryCard.paint();
  }
}

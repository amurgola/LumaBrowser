export default class ImageSetupStore {
  constructor(getImageApi, getDiagApi) {
    this._api = getImageApi;
    this._diag = getDiagApi;
    this.runtimes = null;
    this.models = null;
    this.catalog = null;
    this.defaults = null;
    this.server = null;
    this.enabled = false;
    this.downloadError = null;
    this.autoUnloadMs = 0;
    this.ramPinStatus = null;
    this.vramBytes = null;
    this.activeDl = null;
    this.runtimeInstallProgress = {};
    this.runtimeUpdateInfo = new Map();
  }

  async loadEnabled() {
    try { this.enabled = !!(await this._api().getEnabled()); } catch (_) { this.enabled = false; }
  }

  async loadRuntimes(opts) {
    try {
      const result = await this._api().getRuntimesView(opts && opts.force ? { force: true } : undefined);
      this.runtimes = (result && result.view) || null;
    } catch (_) { this.runtimes = null; }
  }

  async loadModels() {
    try {
      const result = await this._api().getModelsView();
      this.models = (result && result.scan) || { models: [] };
      this.models.config = result && result.config;
    } catch (_) { this.models = { models: [], config: null }; }
  }

  async loadCatalog() {
    try {
      const result = await this._api().modelCatalog();
      this.catalog = (result && result.models) || [];
    } catch (_) { this.catalog = []; }
  }

  async loadDefaults() {
    try { this.defaults = (await this._api().getDefaults()) || {}; } catch (_) { this.defaults = {}; }
    await this._loadAutoUnload();
    await this.loadRamPinStatus();
  }

  async loadServer() {
    try { this.server = (await this._api().getServerStatus()) || null; } catch (_) { this.server = null; }
  }

  async loadVram() {
    try {
      const diag = this._diag();
      if (!diag || !diag.getDiagnostics) return;
      const result = await diag.getDiagnostics({});
      const vram = result && result.success && result.data && result.data.budget && result.data.budget.vram;
      const max = vram && Number(vram.maxBytes);
      this.vramBytes = max && max > 0 ? max : null;
    } catch (_) { this.vramBytes = null; }
  }

  async loadRamPinStatus() {
    try {
      if (!this._api().getRamPinStatus) return null;
      const result = await this._api().getRamPinStatus();
      if (result && result.success) this.ramPinStatus = result.status;
      return (result && result.success) ? result.status : null;
    } catch (_) { return null; }
  }

  installedModels() {
    return (this.models && this.models.models) || [];
  }

  runtimeList() {
    return (this.runtimes && this.runtimes.runtimes) || [];
  }

  findModel(id) {
    return this.installedModels().find((m) => m.id === id) || null;
  }

  async _loadAutoUnload() {
    try {
      if (!this._api().getAutoUnloadMs) return;
      const result = await this._api().getAutoUnloadMs();
      this.autoUnloadMs = (result && result.success) ? (result.ms || 0) : 0;
    } catch (_) { this.autoUnloadMs = 0; }
  }
}

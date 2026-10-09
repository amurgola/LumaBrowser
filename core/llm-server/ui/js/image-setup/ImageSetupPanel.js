import Dom from '../dom/Dom.js';
import ModelList from '../models/ModelList.js';
import ImageDefaultsCard from './ImageDefaultsCard.js';
import ImageModelActions from './ImageModelActions.js';
import ImageModelsCard from './ImageModelsCard.js';
import ImageRuntimesCard from './ImageRuntimesCard.js';
import ImageSetupStore from './ImageSetupStore.js';
import ImportModelModal from './ImportModelModal.js';
import LoraModal from './LoraModal.js';

export default class ImageSetupPanel {
  static NO_API = 'Image server is not available in this build.';

  static BODY_IDS = ['imageDefaultsBody', 'imageRuntimesBody', 'imageModelsBody'];

  constructor(opts) {
    const options = opts || {};
    this._getRoot = options.getApi || (() => window.llmDiagAPI);
    this.modelList = options.modelList || ModelList;
    this.store = new ImageSetupStore(() => this.api(), () => this._getRoot());
    this.defaultsCard = new ImageDefaultsCard(this);
    this.runtimesCard = new ImageRuntimesCard(this);
    this.modelsCard = new ImageModelsCard(this);
    this.actions = new ImageModelActions(this);
    this.importModal = new ImportModelModal(this);
    this.loraModal = new LoraModal(this);
    this._booted = false;
  }

  hasApi() {
    const root = this._getRoot();
    return !!(root && root.image && root.image.getEnabled);
  }

  api() {
    return this._getRoot().image;
  }

  async open() {
    if (!this.hasApi()) { this._paintNoApi(); return; }
    if (!this._booted) { this._booted = true; this._wireEvents(); this._wireRefreshButton(); }
    await this.refreshAll();
  }

  async refreshAll() {
    const s = this.store;
    await Promise.all([
      s.loadEnabled(), this.refreshRuntimes(), this.refreshModels(),
      s.loadCatalog(), s.loadDefaults(), this.refreshServer(), s.loadVram(),
    ]);
    this.defaultsCard.paint();
    this.runtimesCard.paint();
    this.modelsCard.paint();
  }

  reload(what) {
    const loaders = {
      enabled: () => this.store.loadEnabled(),
      defaults: () => this.store.loadDefaults(),
      server: () => this.store.loadServer(),
      catalog: () => this.store.loadCatalog(),
      vram: () => this.store.loadVram(),
    };
    return loaders[what]();
  }

  async refreshRuntimes(opts) {
    await this.store.loadRuntimes(opts);
    this.runtimesCard.paint();
    this.runtimesCard.refreshUpdateInfo();
  }

  async refreshModels() {
    await this.store.loadModels();
    this.modelsCard.paint();
  }

  async refreshServer() {
    await this.store.loadServer();
    this.defaultsCard.paint();
  }

  async refreshModelsAndDefaults() {
    await Promise.all([this.refreshModels(), this.store.loadDefaults()]);
    this.defaultsCard.paint();
  }

  _paintNoApi() {
    for (const id of ImageSetupPanel.BODY_IDS) {
      const el = Dom.byId(id);
      if (el) { el.className = ''; el.textContent = ImageSetupPanel.NO_API; }
    }
  }

  _wireEvents() {
    const api = this.api();
    api.onRuntimeEvent((evt) => this.runtimesCard.onRuntimeEvent(evt));
    api.onModelEvent((evt) => this.modelsCard.onModelEvent(evt));
    api.onServerEvent((evt) => { if (evt && evt.type === 'state-change') this.refreshServer(); });
  }

  _wireRefreshButton() {
    const button = Dom.byId('reloadBtn');
    if (!button) return;
    button.addEventListener('click', () => {
      this.refreshRuntimes({ force: true }).then(() => this.defaultsCard.paint()).catch(() => {});
    });
  }
}

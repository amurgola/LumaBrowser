import ManifestUi from '../slots/ManifestUi.js';
import RendererGlobal from './RendererGlobal.js';

export default class ExtensionRendererHost {
  constructor({ slotManager, meta, loader, hooks }) {
    this._slotManager = slotManager;
    this._meta = meta;
    this._loader = loader;
    this._hooks = hooks;
    this._context = {};
  }

  async loadAll(extensionList, context) {
    this._context = context || {};
    this._meta.setAll(extensionList);
    for (const ext of extensionList) {
      if (!this._shouldLoad(ext)) continue;
      try {
        await this._loader.load(ext);
        if (await this._activate(ext, this._registerManifestUi(ext))) console.log(`UISlotManager: activated renderer for "${ext.id}"`);
      } catch (err) {
        console.error(`UISlotManager: failed to load renderer for "${ext.id}":`, err.message);
      }
    }
  }

  _shouldLoad(ext) {
    if (ext.enabled === false) return false;
    if (ext.loadable === false) {
      console.warn(`UISlotManager: skipping renderer for "${ext.id}": ${ext.unmetDependency ? 'unmet dependency ' + ext.unmetDependency : 'not loaded on main'}`);
      return false;
    }
    return !!ext.renderer;
  }

  disable(extensionId) {
    this._markDeactivated(RendererGlobal.get(extensionId));
    this._slotManager.unregisterExtension(extensionId);
    console.log(`UISlotManager: disabled UI for "${extensionId}"`);
  }

  async enable(extensionId) {
    const ext = this._meta.get(extensionId);
    if (!ext) return;
    await this._refreshMeta(ext);
    if (!ext.renderer) return;
    const existing = RendererGlobal.get(extensionId);
    if (!this._prepareReload(extensionId, existing)) return;
    try {
      await this._loader.load(ext);
    } catch (err) {
      console.error(`UISlotManager: failed to load renderer for "${extensionId}":`, err.message);
      return;
    }
    await this._reactivate(ext, existing, this._registerManifestUi(ext));
  }

  purge(extensionId) {
    RendererGlobal.purge(extensionId);
  }

  isLoaded(extensionId) {
    return !!RendererGlobal.get(extensionId);
  }

  _markDeactivated(mod) {
    if (!mod || typeof mod !== 'object') return;
    if (typeof mod.deactivate === 'function') {
      try { mod.deactivate(); } catch (e) { console.error('Renderer deactivate error:', e); }
      mod.__lumaDeactivated = true;
    } else if (mod.__lumaActive) {
      mod.__lumaStale = true;
    }
    mod.__lumaActive = false;
  }

  async _refreshMeta(ext) {
    try {
      await this._meta.refresh();
      const updated = this._meta.get(ext.id);
      if (updated && updated !== ext) Object.assign(ext, updated);
    } catch (e) {
      console.warn('UISlotManager: failed to refresh extension metadata:', e.message);
    }
  }

  _prepareReload(extensionId, existing) {
    if (!existing || !(existing.__lumaStale || (existing.__lumaActive && !existing.__lumaDeactivated))) return true;
    if (existing.__lumaActive) {
      console.warn(`UISlotManager: "${extensionId}" is already active; not re-running activate()`);
      return false;
    }
    this.purge(extensionId);
    return true;
  }

  async _reactivate(ext, existing, containers) {
    const mod = RendererGlobal.get(ext.id);
    if (mod && typeof mod.activate === 'function') {
      try {
        await this._activate(ext, containers);
        mod.__lumaDeactivated = false;
        console.log(`UISlotManager: re-activated renderer for "${ext.id}"`);
      } catch (err) {
        console.error(`UISlotManager: failed to re-activate renderer for "${ext.id}":`, err.message);
        this._hooks.toast(`"${ext.name || ext.id}" is enabled but its UI failed to start: ${err.message}`, 'bad');
      }
    } else if (existing && !mod) {
      this._hooks.toast(`"${ext.name || ext.id}" is enabled again, but its browser UI needs an app restart.`, 'bad');
    }
  }

  _registerManifestUi(ext) {
    return (ext.navigationBar || ext.settings) ? ManifestUi.register(this._slotManager, ext) : {};
  }

  async _activate(ext, containers) {
    const mod = RendererGlobal.get(ext.id);
    if (!mod || typeof mod.activate !== 'function') return false;
    await mod.activate({
      ...this._context,
      extensionId: ext.id,
      extensionDir: ext.dir,
      ui: ext.ui,
      slotManager: this._slotManager,
      containers,
    });
    mod.__lumaActive = true;
    return true;
  }
}

import RendererGlobal from './RendererGlobal.js';

export default class RendererScriptLoader {
  static INLINE = 'inline';

  static CLASSIC = 'classic';

  static MODULE = 'module';

  static SOURCE_CHANNEL = 'core.shell.getExtensionRendererSource';

  constructor(doc = document) {
    this._doc = doc;
    this._moduleLoads = new Map();
    this._mappedPrefixes = new Set();
  }

  static mode(ext) {
    if (ext.rendererModule === true) return RendererScriptLoader.MODULE;
    if (ext.userInstalled) return RendererScriptLoader.INLINE;
    if (ext.distributable === true) return RendererScriptLoader.CLASSIC;
    return RendererScriptLoader.MODULE;
  }

  static src(ext) {
    const extDirName = ext.dir.replace(/\\/g, '/').split('/extensions/').pop();
    return `extensions/${extDirName}/${ext.renderer.replace(/^\.\//, '')}`;
  }

  async load(ext) {
    if (RendererGlobal.get(ext.id)) return;
    const mode = RendererScriptLoader.mode(ext);
    if (mode === RendererScriptLoader.INLINE) await this._loadInline(ext);
    else await this._loadFile(ext, mode === RendererScriptLoader.MODULE);
  }

  async _loadInline(ext) {
    const r = await window.ipcBridge.invoke(RendererScriptLoader.SOURCE_CHANNEL, ext.id);
    if (!r || !r.success) throw new Error((r && r.error) || 'failed to load renderer source');
    const script = this._doc.createElement('script');
    script.dataset.ext = ext.id;
    script.textContent = r.content;
    this._doc.head.appendChild(script);
  }

  _loadFile(ext, asModule) {
    if (asModule) this._applyImportMap(ext.rendererImports);
    const src = asModule ? this._moduleSrc(ext) : RendererScriptLoader.src(ext);
    return new Promise((resolve, reject) => {
      const script = this._doc.createElement('script');
      if (asModule) script.type = 'module';
      script.dataset.ext = ext.id;
      script.src = src;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
      this._doc.head.appendChild(script);
    });
  }

  _applyImportMap(imports) {
    if (!imports) return;
    const fresh = Object.entries(imports).filter(([prefix]) => !this._mappedPrefixes.has(prefix));
    if (!fresh.length) return;
    for (const [prefix] of fresh) this._mappedPrefixes.add(prefix);
    const map = this._doc.createElement('script');
    map.type = 'importmap';
    map.textContent = JSON.stringify({ imports: Object.fromEntries(fresh) });
    this._doc.head.appendChild(map);
  }

  _moduleSrc(ext) {
    const count = this._moduleLoads.get(ext.id) || 0;
    this._moduleLoads.set(ext.id, count + 1);
    const src = ext.rendererUrl || RendererScriptLoader.src(ext);
    return count === 0 ? src : `${src}?reload=${count}`;
  }
}

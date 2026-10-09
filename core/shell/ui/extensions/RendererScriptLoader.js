import RendererGlobal from './RendererGlobal.js';

export default class RendererScriptLoader {
  static INLINE = 'inline';

  static CLASSIC = 'classic';

  static MODULE = 'module';

  static SOURCE_CHANNEL = 'core.shell.getExtensionRendererSource';

  constructor() {
    this._moduleLoads = new Map();
  }

  static mode(ext) {
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
    const script = document.createElement('script');
    script.dataset.ext = ext.id;
    script.textContent = r.content;
    document.head.appendChild(script);
  }

  _loadFile(ext, asModule) {
    const src = asModule ? this._moduleSrc(ext) : RendererScriptLoader.src(ext);
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      if (asModule) script.type = 'module';
      script.dataset.ext = ext.id;
      script.src = src;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
      document.head.appendChild(script);
    });
  }

  _moduleSrc(ext) {
    const count = this._moduleLoads.get(ext.id) || 0;
    this._moduleLoads.set(ext.id, count + 1);
    const src = RendererScriptLoader.src(ext);
    return count === 0 ? src : `${src}?reload=${count}`;
  }
}

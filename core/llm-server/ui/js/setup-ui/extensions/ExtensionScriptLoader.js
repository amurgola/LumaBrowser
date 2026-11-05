export default class ExtensionScriptLoader {
  constructor(doc = document) {
    this._doc = doc;
    this._injected = new Set();
  }

  inject(url, asModule, onError = null) {
    if (!url || this._injected.has(url)) return false;
    this._injected.add(url);
    const script = this._doc.createElement('script');
    if (asModule) script.type = 'module';
    script.src = url;
    script.async = false;
    if (typeof onError === 'function') script.onerror = () => onError(url);
    this._doc.head.appendChild(script);
    return true;
  }
}

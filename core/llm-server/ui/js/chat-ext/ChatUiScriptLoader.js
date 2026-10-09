export default class ChatUiScriptLoader {
  constructor(doc = document, logger = console) {
    this._doc = doc;
    this._log = logger;
    this._injected = new Set();
  }

  static isModule(descriptor) {
    return !!descriptor && descriptor.chatUiModule === true;
  }

  load(url, { module = false } = {}) {
    return new Promise((resolve) => {
      if (!url || this._injected.has(url)) return resolve();
      this._injected.add(url);
      this._doc.head.appendChild(this._script(url, module, resolve));
    });
  }

  _script(url, module, resolve) {
    const script = this._doc.createElement('script');
    if (module) script.type = 'module';
    script.src = url;
    script.async = false;
    script.onload = () => resolve();
    script.onerror = () => {
      this._log.error('[chat-ext] failed to load mode bundle:', url);
      resolve();
    };
    return script;
  }
}

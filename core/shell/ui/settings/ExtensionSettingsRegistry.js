export default class ExtensionSettingsRegistry {
  constructor() {
    this._container = null;
    this._entries = new Map();
  }

  setContainer(el) {
    this._container = el;
  }

  register(extensionId, content, config) {
    if (!this._container) {
      console.warn('UISlotManager: extensions container not initialized, cannot register settings for', extensionId);
      return null;
    }
    const label = config.label || extensionId;
    const element = ExtensionSettingsRegistry._page(extensionId, content);
    this._container.appendChild(element);
    this._entries.set(extensionId, { label, element, onActivate: config.onActivate || null, config });
    console.log(`UISlotManager: registered extension settings "${label}" for "${extensionId}"`);
    return element;
  }

  registerInSection(extensionId, content, config, section, tab) {
    this.remove(extensionId);
    const label = config.label || extensionId;
    const element = ExtensionSettingsRegistry._page(extensionId, content);
    element.style.display = '';
    section.appendChild(element);
    this._entries.set(extensionId, { label, element, onActivate: config.onActivate || null, config, tab });
    console.log(`UISlotManager: registered extension settings tab "${label}" for "${extensionId}"`);
    return element;
  }

  byTab(tabName) {
    for (const entry of this._entries.values()) {
      if (entry.tab === tabName) return entry;
    }
    return null;
  }

  remove(extensionId) {
    const entry = this._entries.get(extensionId);
    if (entry && entry.element && entry.element.parentNode) entry.element.parentNode.removeChild(entry.element);
    this._entries.delete(extensionId);
  }

  get(extensionId) {
    return this._entries.get(extensionId) || null;
  }

  delete(extensionId) {
    this._entries.delete(extensionId);
  }

  setCallback(extensionId, callbackName, fn) {
    const entry = this._entries.get(extensionId);
    if (entry) entry[callbackName] = fn;
  }

  static _page(extensionId, content) {
    const el = document.createElement('div');
    el.className = 'ext-settings-content';
    el.setAttribute('data-extension-id', extensionId);
    el.style.display = 'none';
    if (typeof content === 'string') el.innerHTML = content;
    else if (content instanceof HTMLElement) el.appendChild(content);
    return el;
  }
}

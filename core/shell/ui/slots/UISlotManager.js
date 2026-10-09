import ExtensionInstallEvents from '../extensions/ExtensionInstallEvents.js';
import ExtensionMetaStore from '../extensions/ExtensionMetaStore.js';
import ExtensionRendererHost from '../extensions/ExtensionRendererHost.js';
import RendererScriptLoader from '../extensions/RendererScriptLoader.js';
import ExtensionSettingsRegistry from '../settings/ExtensionSettingsRegistry.js';
import SettingsScreens from '../settings/SettingsScreens.js';
import ShellHooks from '../settings/ShellHooks.js';
import DockPanel from './DockPanel.js';
import ManifestUi from './ManifestUi.js';
import ToolbarButton from './ToolbarButton.js';

export default class UISlotManager {
  static SETTINGS_SLOT = 'settings-tab';

  static TABBED_SLOTS = ['right-sidebar'];

  static TOOLBAR_SLOTS = ['toolbar-button', 'toolbar-buttons-right'];

  constructor(options = {}) {
    this.slots = new Map();
    this.containers = new Map();
    this.activeExtensions = new Map();
    this._initialized = false;
    this._hooks = new ShellHooks(options.hooks);
    this._meta = new ExtensionMetaStore();
    this._settingsEntries = new ExtensionSettingsRegistry();
    this._host = new ExtensionRendererHost({ slotManager: this, meta: this._meta, loader: new RendererScriptLoader(), hooks: this._hooks });
    this._settings = new SettingsScreens({ meta: this._meta, settingsEntries: this._settingsEntries, host: this._host, hooks: this._hooks });
    this._installEvents = new ExtensionInstallEvents({ host: this._host, meta: this._meta, onListChanged: () => this._settings.refreshListIfVisible() });
  }

  init() {
    if (this._initialized) return;
    for (const el of document.querySelectorAll('[data-slot]')) {
      const slotName = el.getAttribute('data-slot');
      this.containers.set(slotName, el);
      this.slots.set(slotName, new Map());
    }
    this._initialized = true;
    console.log(`UISlotManager: initialized with ${this.containers.size} slot(s): [${[...this.containers.keys()].join(', ')}]`);
  }

  initSettingsTabs() {
    this._settings.init();
  }

  switchSettingsTab(tabName) {
    this._settings.switchTab(tabName);
  }

  refreshTelemetryPanel() {
    return this._settings.loadTelemetry();
  }

  register(slotName, extensionId, content, config = {}) {
    if (slotName === UISlotManager.SETTINGS_SLOT) return this._registerSettingsPage(extensionId, content, config);
    const container = this.containers.get(slotName);
    if (!container) {
      console.warn(`UISlotManager: slot "${slotName}" not found, skipping registration for "${extensionId}"`);
      return null;
    }
    const wrapper = UISlotManager._wrapper(slotName, extensionId, content);
    container.appendChild(wrapper);
    this._track(slotName, extensionId, wrapper, config);
    if (UISlotManager.TOOLBAR_SLOTS.includes(slotName)) ToolbarButton.create(container, extensionId, config);
    if (UISlotManager.TABBED_SLOTS.includes(slotName) && this.slots.get(slotName).size === 1) this.activate(slotName, extensionId);
    console.log(`UISlotManager: registered "${extensionId}" in slot "${slotName}"`);
    return wrapper;
  }

  unregister(slotName, extensionId) {
    const slotMap = this.slots.get(slotName);
    if (!slotMap) return;
    if (slotName === UISlotManager.SETTINGS_SLOT) this._settings.unregisterPage(extensionId);
    const entry = slotMap.get(extensionId);
    if (entry && entry.element.parentNode) entry.element.parentNode.removeChild(entry.element);
    slotMap.delete(extensionId);
    this._cleanContainer(slotName, extensionId);
    if (this.activeExtensions.get(slotName) === extensionId) {
      this.activeExtensions.delete(slotName);
      const next = slotMap.keys().next().value;
      if (next) this.activate(slotName, next);
    }
  }

  unregisterExtension(extensionId) {
    for (const slotName of this.slots.keys()) this.unregister(slotName, extensionId);
    this._settings.unregisterPage(extensionId);
  }

  activate(slotName, extensionId) {
    const slotMap = this.slots.get(slotName);
    if (!slotMap) return;
    for (const [id, entry] of slotMap) entry.element.style.display = (id === extensionId) ? '' : 'none';
    this.activeExtensions.set(slotName, extensionId);
  }

  getContainer(slotName) {
    return this.containers.get(slotName) || null;
  }

  getSlotExtensions(slotName) {
    const slotMap = this.slots.get(slotName);
    return slotMap ? [...slotMap.keys()] : [];
  }

  hasContent(slotName) {
    const slotMap = this.slots.get(slotName);
    return slotMap ? slotMap.size > 0 : false;
  }

  toggle(slotName) {
    const container = this.containers.get(slotName);
    if (!container) return undefined;
    const isVisible = container.style.display !== 'none';
    container.style.display = isVisible ? 'none' : '';
    return !isVisible;
  }

  isVisible(slotName) {
    const container = this.containers.get(slotName);
    return container ? container.style.display !== 'none' : false;
  }

  autoRegisterFromManifest(ext) {
    return ManifestUi.register(this, ext);
  }

  setCallback(slotName, extensionId, callbackName, fn) {
    if (slotName === UISlotManager.SETTINGS_SLOT) {
      this._settingsEntries.setCallback(extensionId, callbackName, fn);
      return;
    }
    const reg = this.slots.has(slotName) ? this.slots.get(slotName).get(extensionId) : null;
    if (reg && reg.config) reg.config[callbackName] = fn;
  }

  async loadExtensions(extensionList, context) {
    this._installEvents.subscribe();
    await this._host.loadAll(extensionList, context);
  }

  _registerSettingsPage(extensionId, content, config) {
    const element = this._settings.registerPage(extensionId, content, config);
    if (element) this._track(UISlotManager.SETTINGS_SLOT, extensionId, element, { ...config, tabId: config.tabId || `ext-${extensionId}` });
    return element;
  }

  _track(slotName, extensionId, element, config) {
    if (!this.slots.has(slotName)) this.slots.set(slotName, new Map());
    this.slots.get(slotName).set(extensionId, { element, config });
  }

  static _wrapper(slotName, extensionId, content) {
    const wrapper = document.createElement('div');
    wrapper.setAttribute('data-extension-id', extensionId);
    wrapper.setAttribute('data-slot-content', slotName);
    wrapper.className = `slot-content slot-content--${slotName}`;
    if (typeof content === 'string') wrapper.innerHTML = content;
    else if (content instanceof HTMLElement) wrapper.appendChild(content);
    if (UISlotManager.TABBED_SLOTS.includes(slotName)) wrapper.style.display = 'none';
    if (DockPanel.isToggleSlot(slotName)) wrapper.classList.add(DockPanel.HIDDEN);
    return wrapper;
  }

  _cleanContainer(slotName, extensionId) {
    const container = this.containers.get(slotName);
    if (!container) return;
    ToolbarButton.remove(container, extensionId);
    if (DockPanel.isToggleSlot(slotName)) DockPanel.collapseIfEmpty(container);
  }
}

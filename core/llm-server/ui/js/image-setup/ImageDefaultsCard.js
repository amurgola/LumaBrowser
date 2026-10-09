import Dom from '../dom/Dom.js';
import ImageDefaultsMarkup from './ImageDefaultsMarkup.js';
import RamPinHint from './RamPinHint.js';

export default class ImageDefaultsCard {
  static AUTO_UNLOAD_MS = 15 * 60 * 1000;

  constructor(panel) {
    this._panel = panel;
    this._ramPinHint = new RamPinHint(panel.store, () => panel.api());
  }

  paint() {
    const body = Dom.byId('imageDefaultsBody');
    if (!body) return;
    body.className = '';
    const view = this._view();
    this._paintPill(view);
    body.innerHTML = ImageDefaultsMarkup.html(view);
    this._wire(body);
    this._ramPinHint.refresh();
    this._panel.modelsCard.paintInstalledMeta();
  }

  _view() {
    const store = this._panel.store;
    return {
      enabled: !!store.enabled,
      state: (store.server && store.server.state) || 'idle',
      server: store.server,
      installedRuntimes: store.runtimeList().filter((r) => r.installed),
      models: store.installedModels(),
      defaults: store.defaults || {},
      autoUnloadMs: store.autoUnloadMs,
      ramPinStatus: store.ramPinStatus,
    };
  }

  _paintPill(view) {
    const pill = Dom.byId('imageDefaultsPill');
    if (!pill) return;
    const { text, className } = ImageDefaultsMarkup.pill(view.enabled, view.state, view.server && view.server.port);
    pill.textContent = text;
    pill.className = className;
  }

  _wire(body) {
    const api = this._panel.api();
    body.querySelector('#imgEnabled').addEventListener('change', (e) => this._save(() => api.setEnabled(!!e.target.checked), ['enabled']));
    this._onChange(body, '#imgRuntimeSel', (value) => this._save(() => api.setDefaults({ runtimeId: value }), ['defaults', 'server']));
    this._onChange(body, '#imgModelSel', (value) => this._save(() => api.setDefaults({ modelId: value }), ['defaults', 'server']));
    this._onChange(body, '#imgEditModelSel', (value) => this._save(() => api.setDefaults({ editModelId: value }), ['defaults']));
    this._onChange(body, '#imgVideoModelSel', (value) => this._save(() => api.setDefaults({ videoModelId: value }), ['defaults']));
    this._onClick(body, '#imgStartBtn', 'Starting…', () => this._save(() => api.startServer(), ['server']));
    this._onClick(body, '#imgStopBtn', 'Stopping…', () => this._save(() => api.stopServer(), ['server']));
    this._wireAutoUnload(body, api);
    const ramPin = body.querySelector('#imgRamPin');
    if (ramPin) ramPin.addEventListener('change', (e) => this._save(() => api.setDefaults({ pinModelRam: !!e.target.checked }), ['defaults']));
  }

  _onChange(body, selector, fn) {
    const select = body.querySelector(selector);
    if (select) select.addEventListener('change', (e) => fn(e.target.value || null));
  }

  _onClick(body, selector, busyLabel, fn) {
    const button = body.querySelector(selector);
    if (!button) return;
    button.addEventListener('click', () => {
      button.disabled = true;
      button.textContent = busyLabel;
      return fn();
    });
  }

  async _save(call, reload) {
    try {
      await call();
    } finally {
      for (const what of reload) await this._panel.reload(what);
      this.paint();
    }
  }

  _wireAutoUnload(body, api) {
    const toggle = body.querySelector('#imgAutoUnload');
    if (!toggle || !api.setAutoUnloadMs) return;
    toggle.addEventListener('change', async () => {
      const ms = toggle.checked ? ImageDefaultsCard.AUTO_UNLOAD_MS : 0;
      try {
        const result = await api.setAutoUnloadMs(ms);
        if (result && result.success) this._panel.store.autoUnloadMs = result.ms || 0;
      } catch (_) {}
      this.paint();
    });
  }
}

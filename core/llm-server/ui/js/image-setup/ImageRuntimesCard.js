import Dom from '../dom/Dom.js';
import Dialogs from '../dialogs/Dialogs.js';
import FoldMemory from '../setup/FoldMemory.js';
import RuntimeInstallModal from '../setup/RuntimeInstallModal.js';
import ImageRuntimeRow from './ImageRuntimeRow.js';
import RuntimeProgressMarkup from './RuntimeProgressMarkup.js';
import RuntimeUpdateBadge from './RuntimeUpdateBadge.js';

export default class ImageRuntimesCard {
  constructor(panel) {
    this._panel = panel;
  }

  paint() {
    const body = Dom.byId('imageRuntimesBody');
    if (!body) return;
    body.className = '';
    const runtimes = this._panel.store.runtimeList();
    const pill = Dom.byId('imageRuntimesPill');
    if (runtimes.length === 0) {
      pill.textContent = 'n/a';
      pill.className = 'luma-badge muted';
      body.textContent = 'No runtimes registered.';
      return;
    }
    const installedCount = runtimes.filter((r) => r.installed).length;
    pill.textContent = `${installedCount}/${runtimes.length} installed`;
    pill.className = installedCount === 0 ? 'luma-badge warn' : 'luma-badge ok';
    body.innerHTML = this._html(runtimes);
    for (const id of this._panel.store.runtimeUpdateInfo.keys()) this._applyBadge(id);
    this._wire(body);
  }

  onRuntimeEvent(evt) {
    if (!evt) return;
    const { id, type, payload } = evt;
    const progress = this._panel.store.runtimeInstallProgress;
    const slot = progress[id] || (progress[id] = {});
    if (type === 'error') {
      slot.phase = 'failed';
      slot.error = (payload && payload.message) || 'install failed';
      this._panel.refreshRuntimes();
      return;
    }
    if (type === 'finalize') {
      delete progress[id];
      this._panel.refreshRuntimes().then(() => this._panel.defaultsCard.paint());
      return;
    }
    ImageRuntimesCard.applyProgress(slot, type, payload);
    this.paintProgress(id);
  }

  static applyProgress(slot, type, payload) {
    if (type === 'start') slot.phase = 'starting';
    else if (type === 'resolved') slot.phase = 'resolved';
    else if (type === 'download') {
      slot.phase = (payload && payload.kind === 'companion') ? 'companion' : 'download';
      slot.received = payload && payload.received;
      slot.total = payload && payload.total;
    } else if (type === 'extract') {
      slot.phase = payload && payload.phase === 'done' ? 'extracted' : 'extracting';
    }
  }

  paintProgress(id) {
    const body = Dom.byId('imageRuntimesBody');
    const row = body && body.querySelector(`[data-runtime-id="${CSS.escape(String(id))}"]`);
    if (!row) { this.paint(); return; }
    const inProgress = this._panel.store.runtimeInstallProgress[id];
    const strip = row.querySelector('[data-runtime-progress]');
    if (strip) strip.outerHTML = RuntimeProgressMarkup.html(inProgress);
    const primary = row.querySelector('.runtime-actions button[data-act="install"]');
    if (primary) primary.hidden = !!(inProgress && inProgress.phase !== 'failed');
  }

  async refreshUpdateInfo() {
    const api = this._panel.hasApi() ? this._panel.api() : null;
    if (!api || !api.checkRuntimeUpdates) return;
    let result;
    try { result = await api.checkRuntimeUpdates(); } catch (_) { return; }
    if (!result || !result.success || !result.updates) return;
    for (const [id, info] of Object.entries(result.updates)) {
      this._panel.store.runtimeUpdateInfo.set(id, info);
      this._applyBadge(id);
    }
  }

  _applyBadge(id) {
    RuntimeUpdateBadge.apply(Dom.byId('imageRuntimesBody'), id, this._panel.store.runtimeUpdateInfo.get(id));
  }

  _html(runtimes) {
    const progress = this._panel.store.runtimeInstallProgress;
    const row = (r) => ImageRuntimeRow.html(r, progress[r.id]);
    const installed = runtimes.filter((r) => r.installed);
    const catalogue = runtimes.filter((r) => !r.installed);
    const busy = catalogue.some((r) => progress[r.id]);
    return (installed.length
      ? installed.map(row).join('')
      : '<div class="luma-empty">No runtime installed yet. Pick one from the catalogue below.</div>')
      + (catalogue.length
        ? `<details class="setup-fold" data-fold-key="image.runtimeCatalogue" ${busy ? 'open' : FoldMemory.attr('image.runtimeCatalogue', installed.length === 0)}>
             <summary><span class="setup-fold-title">Catalogue</span><span class="setup-fold-meta"><span class="fold-chip">${catalogue.length} available</span></span></summary>
             <div class="setup-fold-body">${catalogue.map(row).join('')}</div>
           </details>`
        : '');
  }

  _wire(body) {
    const each = (act, fn) => body.querySelectorAll(`[data-act="${act}"]`).forEach((btn) => btn.addEventListener('click', () => fn(btn)));
    each('install', (btn) => this._install(btn));
    each('uninstall', (btn) => this._uninstall(btn));
    each('clear', (btn) => this._clear(btn));
    each('relocate', (btn) => this.locate(btn.dataset.id));
  }

  async _install(btn) {
    const id = btn.dataset.id;
    const runtime = this._panel.store.runtimeList().find((x) => x.id === id) || {};
    const choice = await RuntimeInstallModal.open({ name: runtime.name || id, assetSupported: runtime.assetSupported !== false, installed: !!runtime.installed });
    if (!choice) return;
    if (choice === 'locate') { await this.locate(id); return; }
    await this._autoInstall(btn, id, runtime);
  }

  async _autoInstall(btn, id, runtime) {
    const api = this._panel.api();
    const progress = this._panel.store.runtimeInstallProgress;
    if (runtime.source === 'manual') { try { await api.registerRuntimeBinary(id, null); } catch (_) {} }
    btn.disabled = true;
    btn.textContent = 'Installing…';
    progress[id] = { phase: 'starting' };
    this.paint();
    try {
      const result = await api.installRuntime(id);
      if (result && result.success === false) progress[id] = { phase: 'failed', error: result.error || 'install failed' };
      else delete progress[id];
    } catch (err) {
      progress[id] = { phase: 'failed', error: (err && err.message) || 'install failed' };
    } finally {
      await this._panel.refreshRuntimes();
    }
  }

  async _uninstall(btn) {
    const id = btn.dataset.id;
    if (!(await Dialogs.confirm(`Uninstall ${id}? This deletes its managed directory.`))) return;
    btn.disabled = true;
    btn.textContent = 'Removing…';
    await this._afterRuntimeChange(() => this._panel.api().uninstallRuntime(id));
  }

  async _clear(btn) {
    const id = btn.dataset.id;
    if (!(await Dialogs.confirm('Clear the registration for this located runtime? Your files stay on disk.'))) return;
    btn.disabled = true;
    await this._afterRuntimeChange(() => this._panel.api().registerRuntimeBinary(id, null));
  }

  async locate(id) {
    await this._afterRuntimeChange(async () => {
      const result = await this._panel.api().locateRuntime(id);
      if (result && result.canceled) return;
      if (!result || !result.success) await Dialogs.alert((result && result.error) || 'Could not find the runtime executable in that folder.');
    });
  }

  async _afterRuntimeChange(call) {
    try {
      await call();
    } finally {
      await this._panel.refreshRuntimes();
      this._panel.defaultsCard.paint();
    }
  }
}

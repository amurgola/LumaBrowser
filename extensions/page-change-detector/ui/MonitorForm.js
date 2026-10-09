import IntervalPicker from '../../ui-kit/ui/IntervalPicker.js';
import MonitorText from './MonitorText.js';

export default class MonitorForm {
  static DEFAULT_INTERVAL_MS = 300000;

  constructor(root, invoke, onSaved) {
    this._invoke = invoke;
    this._onSaved = onSaved;
    this._open = false;
    this._editingId = null;
    this._interval = null;
    this._refs = MonitorForm._findRefs(root);
    this._mountInterval();
    this._bindButtons();
  }

  get editingId() {
    return this._editingId;
  }

  isOpen() {
    return this._open;
  }

  open(monitor) {
    this._open = true;
    this._editingId = monitor ? monitor.id : null;
    this._showOpenChrome(monitor);
    this.setError('');
    this._fill(monitor);
    if (this._refs.nameEl) this._refs.nameEl.focus();
  }

  close() {
    const r = this._refs;
    this._open = false;
    this._editingId = null;
    if (r.form) r.form.classList.add('ext-hidden');
    if (r.newBtn) { r.newBtn.textContent = '+ New monitor'; r.newBtn.classList.add('primary'); }
    if (r.createBtn) { r.createBtn.textContent = 'Create'; r.createBtn.disabled = false; }
    this.setError('');
  }

  closeIfEditing(id) {
    if (this._editingId === id) this.close();
  }

  setError(msg) {
    const el = this._refs.formErr;
    if (!el) return;
    el.textContent = msg || '';
    el.classList.toggle('ext-hidden', !msg);
  }

  read() {
    const r = this._refs;
    return {
      name: (r.nameEl?.value || '').trim(),
      url: (r.urlEl?.value || '').trim(),
      checkIntervalMs: this._interval ? this._interval.get() : MonitorForm.DEFAULT_INTERVAL_MS,
      intervalJitterPercent: parseInt(r.jitterEl?.value, 10) || 0,
      webhookUrl: (r.webhookEl?.value || '').trim(),
      desktopNotifications: r.notifEl ? !!r.notifEl.checked : true,
      noRefreshRequired: r.noRefreshEl ? !!r.noRefreshEl.checked : false,
    };
  }

  async create() {
    const v = this.read();
    if (!v.name) return this.setError('Give the monitor a name.');
    if (!v.url) return this.setError('Enter the page URL to watch.');
    const payload = { ...v, url: v.url.startsWith('http') ? v.url : 'https://' + v.url, enabled: true };
    return this._submit('Creating...', () => this._invoke('create', payload), 'Could not create the monitor.', 'create');
  }

  async save() {
    const v = this.read();
    if (!v.name) return this.setError('Give the monitor a name.');
    const id = this._editingId;
    return this._submit('Saving...', () => this._invoke('update', id, { ...v, url: v.url || undefined }), 'Could not save the monitor.', 'save');
  }

  static _findRefs(root) {
    const q = (id) => root.querySelector(`#${id}`);
    return {
      newBtn: q('pcd-bar-new-btn'),
      form: q('pcd-bar-create-form'),
      formTitle: q('pcd-bar-form-title'),
      formErr: q('pcd-bar-form-err'),
      createBtn: q('pcd-bar-create-btn'),
      cancelBtn: q('pcd-bar-cancel-btn'),
      nameEl: q('pcd-bar-name'),
      urlEl: q('pcd-bar-url'),
      jitterEl: q('pcd-bar-jitter'),
      webhookEl: q('pcd-bar-webhook'),
      notifEl: q('pcd-bar-notifications'),
      noRefreshEl: q('pcd-bar-no-refresh'),
      intervalMount: q('pcd-bar-interval-mount'),
    };
  }

  _mountInterval() {
    const mount = this._refs.intervalMount;
    if (!mount) return;
    mount.innerHTML = IntervalPicker.markup('pcd-bar-interval', MonitorForm.DEFAULT_INTERVAL_MS);
    this._interval = IntervalPicker.bind(mount.querySelector('.luma-interval'));
  }

  _bindButtons() {
    const r = this._refs;
    if (r.newBtn) r.newBtn.addEventListener('click', () => (this._open ? this.close() : this.open(null)));
    if (r.cancelBtn) r.cancelBtn.addEventListener('click', () => this.close());
    if (r.createBtn) r.createBtn.addEventListener('click', () => (this._editingId ? this.save() : this.create()));
  }

  _showOpenChrome(monitor) {
    const r = this._refs;
    if (r.form) r.form.classList.remove('ext-hidden');
    if (r.newBtn) { r.newBtn.textContent = 'Cancel'; r.newBtn.classList.remove('primary'); }
    if (r.formTitle) r.formTitle.textContent = monitor ? 'Edit monitor' : 'New monitor';
    if (r.createBtn) r.createBtn.textContent = monitor ? 'Save' : 'Create';
  }

  _fill(monitor) {
    const r = this._refs;
    if (r.nameEl) r.nameEl.value = monitor ? (monitor.name || '') : '';
    if (r.urlEl) r.urlEl.value = monitor ? (monitor.url || '') : '';
    if (this._interval) this._interval.set(monitor ? (monitor.check_interval_ms || MonitorForm.DEFAULT_INTERVAL_MS) : MonitorForm.DEFAULT_INTERVAL_MS);
    if (r.jitterEl) r.jitterEl.value = MonitorText.jitterChoice(monitor);
    if (r.webhookEl) r.webhookEl.value = monitor ? (monitor.webhook_url || '') : '';
    if (r.notifEl) r.notifEl.checked = monitor ? !!monitor.desktop_notifications : true;
    if (r.noRefreshEl) r.noRefreshEl.checked = monitor ? !!monitor.no_refresh_required : false;
  }

  async _submit(busyLabel, call, fallbackError, action) {
    const btn = this._refs.createBtn;
    btn.disabled = true;
    btn.textContent = busyLabel;
    try {
      const result = await call();
      if (result.success) {
        this.close();
        await this._onSaved();
      } else {
        this.setError(result.error || fallbackError);
      }
    } catch (err) {
      console.error(`page-change-detector: ${action} failed:`, err);
      this.setError(fallbackError);
    } finally {
      btn.disabled = false;
      if (this._open) btn.textContent = this._editingId ? 'Save' : 'Create';
    }
  }
}

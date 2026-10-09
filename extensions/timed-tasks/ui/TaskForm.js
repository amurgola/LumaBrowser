import IntervalPicker from '../../ui-kit/ui/IntervalPicker.js';

export default class TaskForm {
  static DEFAULT_INTERVAL_MS = 3600000;

  constructor(root, invoke, onSaved) {
    this._invoke = invoke;
    this._onSaved = onSaved;
    this._isOpen = false;
    this._editingId = null;
    this._findElements(root);
    this._mountInterval();
    this._bindEvents();
  }

  get isOpen() { return this._isOpen; }

  get editingId() { return this._editingId; }

  open(task) {
    const r = this._refs;
    this._isOpen = true;
    this._editingId = task ? task.id : null;
    if (r.form) r.form.classList.remove('ext-hidden');
    if (r.newBtn) { r.newBtn.textContent = 'Cancel'; r.newBtn.classList.remove('primary'); }
    if (r.formTitle) r.formTitle.textContent = task ? 'Edit task' : 'New task';
    if (r.createBtn) r.createBtn.textContent = task ? 'Save' : 'Create';
    this._setError('');
    this._fill(task);
    if (r.nameEl) r.nameEl.focus();
  }

  close() {
    const r = this._refs;
    this._isOpen = false;
    this._editingId = null;
    if (r.form) r.form.classList.add('ext-hidden');
    if (r.newBtn) { r.newBtn.textContent = '+ New task'; r.newBtn.classList.add('primary'); }
    if (r.createBtn) { r.createBtn.textContent = 'Create'; r.createBtn.disabled = false; }
    this._setError('');
  }

  async submit() {
    const values = this._read();
    if (!values.name) return this._setError('Give the task a name.');
    if (!values.requestPrompt) return this._setError('Describe what the AI should do each run.');
    if (this._editingId) return this._send('Saving...', 'Could not save the task.', 'save',
      () => this._invoke('updateTask', this._editingId, values));
    return this._send('Creating...', 'Could not create the task.', 'create',
      () => this._invoke('createTask', { ...values, enabled: true }));
  }

  _findElements(root) {
    const q = (id) => root.querySelector(`#${id}`);
    this._refs = {
      newBtn: q('tt-bar-new-btn'),
      form: q('tt-bar-create-form'),
      formTitle: q('tt-bar-form-title'),
      formErr: q('tt-bar-form-err'),
      createBtn: q('tt-bar-create-btn'),
      cancelBtn: q('tt-bar-cancel-btn'),
      nameEl: q('tt-bar-name'),
      promptEl: q('tt-bar-prompt'),
      responsePromptEl: q('tt-bar-response-prompt'),
      webhookEl: q('tt-bar-webhook'),
      intervalMount: q('tt-bar-interval-mount'),
    };
  }

  _mountInterval() {
    const mount = this._refs.intervalMount;
    this._interval = null;
    if (!mount) return;
    mount.innerHTML = IntervalPicker.markup('tt-bar-interval', TaskForm.DEFAULT_INTERVAL_MS);
    this._interval = IntervalPicker.bind(mount.querySelector('.luma-interval'));
  }

  _bindEvents() {
    const r = this._refs;
    if (r.newBtn) r.newBtn.addEventListener('click', () => (this._isOpen ? this.close() : this.open(null)));
    if (r.cancelBtn) r.cancelBtn.addEventListener('click', () => this.close());
    if (r.createBtn) r.createBtn.addEventListener('click', () => this.submit());
  }

  _fill(task) {
    const r = this._refs;
    if (r.nameEl) r.nameEl.value = task ? (task.name || '') : '';
    if (r.promptEl) r.promptEl.value = task ? (task.request_prompt || '') : '';
    if (r.responsePromptEl) r.responsePromptEl.value = task ? (task.response_prompt || '') : '';
    if (r.webhookEl) r.webhookEl.value = task ? (task.webhook_url || '') : '';
    if (this._interval) this._interval.set(task ? (task.repeat_interval || TaskForm.DEFAULT_INTERVAL_MS) : TaskForm.DEFAULT_INTERVAL_MS);
  }

  _read() {
    const r = this._refs;
    return {
      name: (r.nameEl?.value || '').trim(),
      requestPrompt: (r.promptEl?.value || '').trim(),
      responsePrompt: (r.responsePromptEl?.value || '').trim(),
      webhookUrl: (r.webhookEl?.value || '').trim(),
      repeatInterval: this._interval ? this._interval.get() : TaskForm.DEFAULT_INTERVAL_MS,
    };
  }

  async _send(busyText, fallbackError, verb, call) {
    const btn = this._refs.createBtn;
    btn.disabled = true;
    btn.textContent = busyText;
    try {
      const result = await call();
      if (result.success) {
        this.close();
        await this._onSaved();
      } else {
        this._setError(result.error || fallbackError);
      }
    } catch (err) {
      console.error(`timed-tasks: ${verb} failed:`, err);
      this._setError(fallbackError);
    } finally {
      btn.disabled = false;
      if (this._isOpen) btn.textContent = this._editingId ? 'Save' : 'Create';
    }
  }

  _setError(msg) {
    const el = this._refs.formErr;
    if (!el) return;
    el.textContent = msg || '';
    el.classList.toggle('ext-hidden', !msg);
  }
}

export default class WatcherForm {
  static TEST_RESULT_MS = 6000;

  constructor(els) {
    this._els = els;
    this._testTimer = null;
  }

  read() {
    const els = this._els;
    return {
      urlPattern: els.urlPattern.value.trim(),
      sendTo: els.sendTo.value.trim(),
      note: els.note.value.trim(),
      method: els.method.value,
      captureHeaders: els.captureHeaders.checked,
      captureBody: els.captureBody.checked,
    };
  }

  clear() {
    const els = this._els;
    els.urlPattern.value = '';
    els.sendTo.value = '';
    els.note.value = '';
    els.method.value = '*';
    els.captureHeaders.checked = false;
    els.captureBody.checked = false;
    this.setError('');
  }

  setError(msg) {
    const { formErr } = this._els;
    if (!formErr) return;
    formErr.textContent = msg || '';
    formErr.classList.toggle('ext-hidden', !msg);
  }

  setTestResult(msg, ok) {
    const { testResult } = this._els;
    if (!testResult) return;
    testResult.textContent = msg || '';
    testResult.style.color = ok === undefined ? '' : (ok ? 'var(--good)' : 'var(--bad)');
    if (this._testTimer) clearTimeout(this._testTimer);
    if (msg) this._testTimer = setTimeout(() => { testResult.textContent = ''; }, WatcherForm.TEST_RESULT_MS);
  }

  dispose() {
    if (this._testTimer) clearTimeout(this._testTimer);
    this._testTimer = null;
  }
}

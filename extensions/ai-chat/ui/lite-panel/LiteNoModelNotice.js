export default class LiteNoModelNotice {
  static DISABLED_PLACEHOLDER = 'Set up a model in the LLM tab to start chatting';

  constructor({ messagesEl, inputEl, sendBtn, onOpenSetup }) {
    this._messagesEl = messagesEl;
    this._inputEl = inputEl;
    this._sendBtn = sendBtn;
    this._onOpenSetup = onOpenSetup;
    this._placeholder = null;
  }

  render(configured, running) {
    if (!this._messagesEl) return;
    if (configured) this._clear(running);
    else this._show();
  }

  _clear(running) {
    const existing = this._existing();
    if (existing) existing.remove();
    if (this._inputEl) {
      this._inputEl.disabled = !!running;
      if (this._placeholder) this._inputEl.placeholder = this._placeholder;
    }
    if (this._sendBtn) this._sendBtn.disabled = false;
  }

  _show() {
    if (this._inputEl) {
      if (!this._placeholder) this._placeholder = this._inputEl.placeholder;
      this._inputEl.disabled = true;
      this._inputEl.placeholder = LiteNoModelNotice.DISABLED_PLACEHOLDER;
    }
    if (this._sendBtn) this._sendBtn.disabled = true;
    if (!this._existing()) this._messagesEl.insertBefore(this._build(), this._messagesEl.firstChild);
  }

  _existing() {
    return this._messagesEl.querySelector('.ai-lite-notice');
  }

  _build() {
    const box = document.createElement('div');
    box.className = 'ai-lite-notice';
    const text = document.createElement('span');
    text.textContent = 'No model is configured yet. Pick a local model or add a provider in the LLM tab, then come back here.';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'luma-btn primary';
    btn.textContent = 'Open LLM setup';
    btn.addEventListener('click', () => this._onOpenSetup());
    box.appendChild(text);
    box.appendChild(btn);
    return box;
  }
}

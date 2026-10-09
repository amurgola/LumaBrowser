export default class LiteServerBadge {
  static DOT_CLASS = { starting: 'busy', ready: 'ok', busy: 'busy', waiting: 'busy', error: 'bad' };

  constructor({ toggleBtn, stateDot, contextEl }) {
    this._toggleBtn = toggleBtn;
    this._stateDot = stateDot;
    this._contextEl = contextEl;
  }

  paint(st, contextLabel) {
    const configured = st.configured !== false;
    this._paintDot(st, configured);
    this._paintButton(st, configured);
    if (this._contextEl && contextLabel != null) this._contextEl.textContent = contextLabel;
  }

  _paintDot(st, configured) {
    if (!this._stateDot) return;
    const dotClass = st.status === 'off' ? (configured ? '' : 'warn') : (LiteServerBadge.DOT_CLASS[st.status] || '');
    this._stateDot.className = 'luma-dot ai-chat-state-dot' + (dotClass ? ' ' + dotClass : '');
  }

  _paintButton(st, configured) {
    if (!this._toggleBtn) return;
    this._toggleBtn.disabled = false;
    const model = st.model ? ` (${st.model})` : '';
    this._toggleBtn.title = configured
      ? `AI Chat: ${st.label || st.status}${model}`
      : 'AI Chat: No model configured, open the LLM tab';
    this._toggleBtn.setAttribute('aria-label', this._toggleBtn.title);
  }
}

export default class ChatShortcuts {
  constructor(ctx) {
    this._ctx = ctx;
    this._bound = false;
  }

  install() {
    if (this._bound) return;
    this._bound = true;
    document.addEventListener('keydown', (e) => this._onKey(e));
  }

  onComposerKey(e, ta) {
    if (e.key !== 'ArrowUp' || e.shiftKey || e.altKey || e.ctrlKey || e.metaKey || ta.value !== '') return false;
    if (!this.editLastPrompt()) return false;
    e.preventDefault();
    return true;
  }

  editLastPrompt() {
    const { state, els } = this._ctx;
    if (state.streaming || !els.scroll) return false;
    for (let i = state.messages.length - 1; i >= 0; i--) {
      const m = state.messages[i];
      if (m.role !== 'user') continue;
      const turn = m.id && els.scroll.querySelector('.cm-turn[data-msg-id="' + m.id + '"]');
      if (!turn) return false;
      this._ctx.userEditor.edit(m, turn);
      return true;
    }
    return false;
  }

  _onKey(e) {
    if (e.defaultPrevented || !this._onScreen()) return;
    if (e.key === 'Escape' && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) this._escape(e);
    else if ((e.ctrlKey || e.metaKey) && e.shiftKey && !e.altKey && (e.key === 'n' || e.key === 'N')) {
      e.preventDefault();
      this._ctx.conversation.newChat();
    }
  }

  _escape(e) {
    const { state, root } = this._ctx;
    if (document.querySelector('.cm-modal-back')) return;
    if (root.querySelector('.cm-model-pop') || document.querySelector('.cm-menu')) {
      this._ctx.popovers.closeAll();
      return;
    }
    if (state.streaming && state.streamOnScreen()) {
      e.preventDefault();
      this._ctx.sender.abort();
    }
  }

  _onScreen() {
    for (let el = this._ctx.root; el; el = el.parentElement) {
      if (el.hidden || (el.style && el.style.display === 'none')) return false;
    }
    return !!(this._ctx.root && this._ctx.root.isConnected);
  }
}

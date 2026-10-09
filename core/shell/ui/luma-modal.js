(function installLumaModal() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window.LumaModal && window.LumaModal._installed) return;

  class LumaModal {
    static STYLE_ID = 'lm-styles';

    static CLOSE_MS = 120;

    static CSS = `
.lm-overlay {
  position: fixed; inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex; align-items: center; justify-content: center;
  z-index: 2147483640;
  opacity: 0;
  transition: opacity 0.12s ease-out;
  font-family: var(--font-sans, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  -webkit-font-smoothing: antialiased;
  backdrop-filter: blur(2px);
}
.lm-overlay.is-open { opacity: 1; }
.lm-modal {
  min-width: 320px; max-width: 480px;
  background: var(--bg-card, #1a1f2e);
  color: var(--text, #e6e8ee);
  border: 1px solid var(--border, rgba(255,255,255,0.08));
  border-radius: 12px;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.55), 0 2px 0 rgba(255, 255, 255, 0.03) inset;
  padding: 22px 22px 18px;
  transform: translateY(6px) scale(0.985);
  transition: transform 0.12s ease-out;
  display: flex; flex-direction: column;
  gap: 16px;
}
.lm-overlay.is-open .lm-modal { transform: none; }
.lm-title {
  font-size: 14px; font-weight: 600;
  color: var(--text, #e6e8ee);
  letter-spacing: 0.01em;
}
.lm-msg {
  font-size: 13px; line-height: 1.55;
  color: var(--text-muted, #a8aebd);
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 50vh; overflow-y: auto;
}
.lm-input {
  width: 100%;
  font-family: var(--font-mono, ui-monospace, SFMono-Regular, Consolas, monospace);
  font-size: 13px;
  color: var(--text, #e6e8ee);
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid var(--border-strong, rgba(255,255,255,0.12));
  border-radius: 8px;
  padding: 9px 11px;
  outline: none;
  transition: border-color 0.1s;
}
.lm-input:focus { border-color: var(--accent, #f59034); }
.lm-actions {
  display: flex; justify-content: flex-end; gap: 8px;
  margin-top: 2px;
}
.lm-btn {
  font: inherit;
  font-size: 12px; font-weight: 500;
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid var(--border-strong, rgba(255,255,255,0.12));
  background: rgba(255, 255, 255, 0.03);
  color: var(--text, #e6e8ee);
  cursor: pointer;
  transition: background 0.08s, border-color 0.08s, color 0.08s;
  min-width: 84px;
}
.lm-btn:hover { background: rgba(255, 255, 255, 0.07); }
.lm-btn:focus-visible { outline: 2px solid var(--accent, #f59034); outline-offset: 2px; }
.lm-btn.is-primary {
  background: var(--accent, #f59034);
  border-color: var(--accent, #f59034);
  color: #0a0d14;
  font-weight: 600;
}
.lm-btn.is-primary:hover { background: var(--accent-hover, #ffb06b); border-color: var(--accent-hover, #ffb06b); }
.lm-btn.is-danger {
  background: #b91c1c;
  border-color: #b91c1c;
  color: #fff;
  font-weight: 600;
}
.lm-btn.is-danger:hover { background: #dc2626; border-color: #dc2626; }
`;

    static install(win) {
      const modal = new LumaModal(win.document);
      LumaModal._injectStyles(win.document);
      win.LumaModal = modal.api();
      try { win.alert = (msg) => modal.alert(msg); } catch (_) {}
      try { win.confirm = (msg) => modal.confirm(msg); } catch (_) {}
      try { win.prompt = (msg, def) => modal.prompt(msg, def); } catch (_) {}
      return modal;
    }

    static _injectStyles(doc) {
      if (doc.getElementById(LumaModal.STYLE_ID)) return;
      const style = doc.createElement('style');
      style.id = LumaModal.STYLE_ID;
      style.textContent = LumaModal.CSS;
      doc.head.appendChild(style);
    }

    constructor(doc) {
      this._doc = doc;
      this._stack = [];
    }

    api() {
      return {
        _installed: true,
        alert: (message, opts) => this.alert(message, opts),
        confirm: (message, opts) => this.confirm(message, opts),
        prompt: (message, defaultValue, opts) => this.prompt(message, defaultValue, opts),
      };
    }

    alert(message, opts) {
      return this._show(Object.assign({ kind: 'alert', message }, opts || {}));
    }

    confirm(message, opts) {
      return this._show(Object.assign({ kind: 'confirm', message }, opts || {}));
    }

    prompt(message, defaultValue, opts) {
      return this._show(Object.assign({ kind: 'prompt', message, defaultValue }, opts || {}));
    }

    _show(opts) {
      const kind = opts.kind || 'alert';
      return new Promise((resolve) => {
        const view = this._build(kind, opts);
        const close = this._closer(view, resolve);
        this._wire(view, kind, close);
        this._open(view);
      });
    }

    _build(kind, opts) {
      const doc = this._doc;
      const overlay = this._el('div', 'lm-overlay');
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');
      const modal = overlay.appendChild(this._el('div', 'lm-modal'));
      modal.appendChild(this._el('div', 'lm-title', opts.title || LumaModal._defaultTitle(kind)));
      modal.appendChild(this._el('div', 'lm-msg', opts.message == null ? '' : String(opts.message)));
      const input = kind === 'prompt' ? modal.appendChild(this._input(opts.defaultValue)) : null;
      const actions = modal.appendChild(this._el('div', 'lm-actions'));
      const cancelBtn = kind !== 'alert' ? actions.appendChild(this._button('lm-btn', opts.cancelLabel || 'Cancel')) : null;
      const okBtn = actions.appendChild(this._button('lm-btn ' + (opts.danger ? 'is-danger' : 'is-primary'),
        opts.okLabel || (kind === 'confirm' ? 'Confirm' : 'OK')));
      return { doc, overlay, input, cancelBtn, okBtn, prevFocus: doc.activeElement };
    }

    _closer(view, resolve) {
      let settled = false;
      return (value) => {
        if (settled) return;
        settled = true;
        view.doc.removeEventListener('keydown', view.onKey);
        view.overlay.classList.remove('is-open');
        setTimeout(() => this._teardown(view, value, resolve), LumaModal.CLOSE_MS);
      };
    }

    _teardown(view, value, resolve) {
      if (view.overlay.parentNode) view.overlay.parentNode.removeChild(view.overlay);
      const index = this._stack.indexOf(view.overlay);
      if (index >= 0) this._stack.splice(index, 1);
      const prev = view.prevFocus;
      if (prev && typeof prev.focus === 'function' && view.doc.contains(prev)) {
        try { prev.focus(); } catch (_) {}
      }
      resolve(value);
    }

    _wire(view, kind, close) {
      const cancelValue = kind === 'prompt' ? null : kind === 'confirm' ? false : undefined;
      if (view.cancelBtn) view.cancelBtn.addEventListener('click', () => close(cancelValue));
      view.okBtn.addEventListener('click', () => close(LumaModal._okValue(kind, view.input)));
      if (view.input) view.input.addEventListener('keydown', (e) => LumaModal._onInputKey(e, view.input, close));
      view.overlay.addEventListener('click', (e) => { if (e.target === view.overlay) close(cancelValue); });
      view.onKey = (e) => {
        if (e.key !== 'Escape') return;
        if (this._stack[this._stack.length - 1] !== view.overlay) return;
        e.preventDefault();
        close(cancelValue);
      };
      view.doc.addEventListener('keydown', view.onKey);
    }

    _open(view) {
      this._stack.push(view.overlay);
      view.doc.body.appendChild(view.overlay);
      requestAnimationFrame(() => requestAnimationFrame(() => {
        view.overlay.classList.add('is-open');
        if (view.input) { try { view.input.focus(); view.input.select(); } catch (_) {} } else { try { view.okBtn.focus(); } catch (_) {} }
      }));
    }

    _el(tag, className, text) {
      const el = this._doc.createElement(tag);
      el.className = className;
      if (text !== undefined) el.textContent = text;
      return el;
    }

    _input(defaultValue) {
      const input = this._el('input', 'lm-input');
      input.type = 'text';
      input.value = defaultValue != null ? String(defaultValue) : '';
      return input;
    }

    _button(className, label) {
      const button = this._el('button', className, label);
      button.type = 'button';
      return button;
    }

    static _onInputKey(e, input, close) {
      if (e.key === 'Enter') { e.preventDefault(); close(input.value); } else if (e.key === 'Escape') { e.preventDefault(); close(null); }
    }

    static _okValue(kind, input) {
      if (kind === 'prompt') return input ? input.value : '';
      if (kind === 'confirm') return true;
      return undefined;
    }

    static _defaultTitle(kind) {
      return kind === 'confirm' ? 'Confirm' : kind === 'prompt' ? 'Input' : 'Notice';
    }
  }

  LumaModal.install(window);
})();

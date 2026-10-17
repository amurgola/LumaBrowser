(function installLumaModal() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window.LumaModal && window.LumaModal._installed) return;

  class LumaModal {
    static STYLE_ID = 'lm-styles';

    static CLOSE_MS = 120;

    static CSS = `
.lm-overlay {
  position: fixed; inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
  z-index: 2147483640;
  opacity: 0;
  transition: opacity var(--dur-fast, 120ms) var(--ease, ease-out);
  font-family: var(--font-sans, "Segoe UI Variable Text", "Segoe UI", system-ui, -apple-system, sans-serif);
  -webkit-font-smoothing: antialiased;
}
.lm-overlay.is-open { opacity: 1; }
.lm-modal {
  min-width: 320px; max-width: 480px;
  background: var(--surface-pop, #141b2c);
  color: var(--text-primary, #e6e9f2);
  border-radius: var(--radius-xl, 12px);
  box-shadow: var(--shadow-pop, 0 12px 32px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.06));
  padding: 20px;
  display: flex; flex-direction: column;
  gap: 12px;
}
.lm-title {
  font-size: var(--text-lg, 15px); font-weight: 600;
  color: var(--text-primary, #e6e9f2);
}
.lm-msg {
  font-size: var(--text-md, 13px); line-height: 1.45;
  color: var(--text-secondary, #8a95ad);
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 50vh; overflow-y: auto;
}
.lm-input {
  width: 100%; height: 32px;
  font-family: var(--font-mono, "Cascadia Mono", ui-monospace, Consolas, monospace);
  font-size: var(--text-md, 13px);
  color: var(--text-primary, #e6e9f2);
  background: var(--bg-surface-2, #172038);
  border: 1px solid var(--border-soft, rgba(255, 255, 255, 0.07));
  border-radius: var(--radius-md, 6px);
  padding: 0 12px;
  outline: none;
  transition: border-color var(--dur-fast, 120ms) var(--ease, ease-out);
}
.lm-input:focus { border-color: var(--accent, #f59034); box-shadow: var(--focus-ring, 0 0 0 1px #f59034); }
.lm-actions {
  display: flex; justify-content: flex-end; gap: 8px;
  margin-top: 4px;
}
.lm-btn {
  font: inherit;
  font-size: var(--text-md, 13px); font-weight: 500;
  min-height: 32px; min-width: 80px;
  padding: 0 12px;
  border-radius: var(--radius-md, 6px);
  border: 1px solid var(--border-soft, rgba(255, 255, 255, 0.07));
  background: var(--bg-surface-2, #172038);
  color: var(--text-primary, #e6e9f2);
  cursor: pointer;
  transition: background-color var(--dur-fast, 120ms) var(--ease, ease-out), border-color var(--dur-fast, 120ms) var(--ease, ease-out);
}
.lm-btn:hover { background: var(--bg-elevated, #1a2340); border-color: var(--border-strong, rgba(255, 255, 255, 0.14)); }
.lm-btn:focus-visible { outline: none; box-shadow: var(--focus-ring, 0 0 0 1px #f59034); }
.lm-btn.is-primary {
  background: var(--accent, #f59034);
  border-color: var(--accent, #f59034);
  color: var(--on-accent, #1a1206);
}
.lm-btn.is-primary:hover { background: var(--accent-hover, #e07d22); border-color: var(--accent-hover, #e07d22); }
.lm-btn.is-danger { color: var(--danger, #f87171); }
.lm-btn.is-danger:hover { background: var(--danger-dim, rgba(248, 113, 113, 0.12)); color: var(--danger, #f87171); }
@media (prefers-reduced-motion: reduce) { .lm-overlay { transition: none; } }
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

import HtmlEscaper from '../../../core/llm-server/ui/js/format/HtmlEscaper.js';

export default class PermissionPrompts {
  static STYLE = '<style>'
    + '.bd-perm { padding: 12px 14px; }'
    + '.bd-perm-title { color: var(--text); font-size: 13px; font-weight: 600; margin-bottom: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }'
    + '.bd-perm-what { color: var(--text-dim); font-size: 12px; margin-bottom: 10px; }'
    + '.bd-perm-actions { display: flex; gap: 6px; }'
    + '.bd-perm-actions button { width: auto; flex: 1; justify-content: center; padding: 6px 8px; font-size: 12px; border: 1px solid var(--border-strong); color: var(--text); }'
    + '.bd-perm-actions button.bd-perm-primary { border-color: var(--accent); color: var(--accent); }'
    + '</style>';

  static DECISIONS = { 'perm-once': 'once', 'perm-always': 'always', 'perm-block': 'block' };

  constructor({ store, addressBar }) {
    this._store = store;
    this._addressBar = addressBar;
    this._prompts = new Map();
  }

  get size() {
    return this._prompts.size;
  }

  install() {
    const api = window.permissionPromptAPI;
    if (!api) return;
    api.onPrompt((p) => this._add(p));
    api.onClose((p) => this._remove(p));
  }

  current() {
    for (const p of this._prompts.values()) {
      if (p.tabId == null || p.tabId === this._store.activeTabId) return p;
    }
    return null;
  }

  render() {
    if (!window.chromeOverlayAPI) return;
    const p = this.current();
    if (!p) { window.chromeOverlayAPI.hide('perm'); return; }
    window.chromeOverlayAPI.show({ id: 'perm', html: PermissionPrompts.html(p), ...this._placement() });
  }

  static html(p) {
    const esc = HtmlEscaper.escape;
    const id = esc(p.requestId);
    return `${PermissionPrompts.STYLE}<div class="bd-context-menu bd-perm">`
      + `<div class="bd-perm-title">${esc(p.host || p.origin)} wants to</div>`
      + `<div class="bd-perm-what">${esc(p.what || 'use your camera and microphone')}</div>`
      + '<div class="bd-perm-actions">'
      + `<button class="bd-perm-primary" data-bd-action="perm-once" data-bd-id="${id}">Allow once</button>`
      + `<button data-bd-action="perm-always" data-bd-id="${id}">Always allow</button>`
      + `<button data-bd-action="perm-block" data-bd-id="${id}">Block</button>`
      + '</div></div>';
  }

  handleAction(payload) {
    const p = payload && payload.id != null ? this._prompts.get(String(payload.id)) : null;
    if (!p) { this.render(); return; }
    const decision = PermissionPrompts.DECISIONS[payload.action] || 'dismiss';
    this._prompts.delete(p.requestId);
    if (window.permissionPromptAPI) window.permissionPromptAPI.respond(p.requestId, decision);
    this.render();
  }

  _add(p) {
    if (!p || p.requestId == null) return;
    this._prompts.set(String(p.requestId), { ...p, requestId: String(p.requestId) });
    this.render();
  }

  _remove(p) {
    if (!p || p.requestId == null) return;
    if (this._prompts.delete(String(p.requestId))) this.render();
  }

  _placement() {
    const r = this._addressBar.anchorRect() || { left: 12, bottom: 48 };
    const width = Math.min(380, Math.max(260, window.innerWidth - 24));
    const x = Math.max(0, Math.min(r.left, window.innerWidth - width));
    return { x, y: r.bottom + 6, width, maxHeight: 160, estHeight: 104 };
  }
}

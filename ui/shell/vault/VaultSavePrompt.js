import HtmlEscaper from '../../../core/llm-server/ui/js/format/HtmlEscaper.js';

export default class VaultSavePrompt {
  static LAYER = 'vault';

  static STYLE = '<style>'
    + '.bd-vault { padding: 12px 14px; }'
    + '.bd-vault-title { color: var(--text); font-size: 13px; font-weight: 600; margin-bottom: 8px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }'
    + '.bd-vault-login { display: flex; gap: 10px; color: var(--text-dim); font-size: 12px; margin-bottom: 10px; }'
    + '.bd-vault-user { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--text); }'
    + '.bd-vault-actions { display: flex; gap: 6px; }'
    + '.bd-vault-actions button { width: auto; flex: 1; justify-content: center; padding: 6px 8px; font-size: 12px; border: 1px solid var(--border-strong); color: var(--text); }'
    + '.bd-vault-actions button.bd-vault-primary { border-color: var(--accent); color: var(--accent); }'
    + '</style>';

  static DECISIONS = { 'vault-save': 'save', 'vault-never': 'never', 'vault-dismiss': 'dismiss' };

  constructor({ store, addressBar, onAnswered = () => {} }) {
    this._store = store;
    this._addressBar = addressBar;
    this._onAnswered = onAnswered;
    this._prompts = new Map();
  }

  get size() {
    return this._prompts.size;
  }

  install() {
    const api = window.vaultAPI;
    if (!api) return;
    api.onSavePrompt((p) => this._add(p));
    api.onSavePromptClose((p) => this._remove(p));
  }

  current() {
    for (const p of this._prompts.values()) if (p.tabId === this._store.activeTabId) return p;
    return null;
  }

  render() {
    if (!window.chromeOverlayAPI) return;
    const p = this.current();
    if (!p) { window.chromeOverlayAPI.hide(VaultSavePrompt.LAYER); return; }
    window.chromeOverlayAPI.show({ id: VaultSavePrompt.LAYER, html: VaultSavePrompt.html(p), ...this._placement() });
  }

  static html(p) {
    const esc = HtmlEscaper.escape;
    const id = esc(p.promptId);
    const button = (action, label, primary) => `<button${primary ? ' class="bd-vault-primary"' : ''} data-bd-action="${action}" data-bd-id="${id}">${label}</button>`;
    if (p.kind === 'profile') {
      return `${VaultSavePrompt.STYLE}<div class="bd-context-menu bd-vault">`
        + `<div class="bd-vault-title">${p.update ? 'Update your saved address?' : 'Save this address for autofill?'}</div>`
        + `<div class="bd-vault-login"><span class="bd-vault-user">${esc(p.summary || '')}</span></div>`
        + `<div class="bd-vault-actions">${button('vault-save', p.update ? 'Update' : 'Save', true)}${button('vault-dismiss', 'Not now')}</div></div>`;
    }
    const title = p.update ? `Update your password for ${p.host}?` : `Save your password for ${p.host}?`;
    return `${VaultSavePrompt.STYLE}<div class="bd-context-menu bd-vault">`
      + `<div class="bd-vault-title">${esc(title)}</div>`
      + `<div class="bd-vault-login"><span class="bd-vault-user">${esc(p.username || 'No username')}</span><span>&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;</span></div>`
      + '<div class="bd-vault-actions">'
      + button('vault-save', p.update ? 'Update' : 'Save', true)
      + (p.update ? '' : button('vault-never', 'Never for this site'))
      + button('vault-dismiss', 'Not now')
      + '</div></div>';
  }

  handleAction(payload) {
    const p = payload && payload.id != null ? this._prompts.get(String(payload.id)) : null;
    if (!p) { this.render(); return; }
    const decision = VaultSavePrompt.DECISIONS[payload.action] || 'dismiss';
    this._prompts.delete(p.promptId);
    if (window.vaultAPI) Promise.resolve(window.vaultAPI.answerPrompt(p.promptId, decision)).then(() => this._onAnswered(), () => {});
    this.render();
  }

  _add(p) {
    if (!p || !p.promptId) return;
    this._prompts.set(String(p.promptId), { ...p, promptId: String(p.promptId) });
    this.render();
  }

  _remove(p) {
    if (p && this._prompts.delete(String(p.promptId))) this.render();
  }

  _placement() {
    const r = this._addressBar.anchorRect() || { right: window.innerWidth - 12, bottom: 48 };
    const width = Math.min(340, Math.max(260, window.innerWidth - 24));
    const x = Math.max(0, Math.min(r.right - width, window.innerWidth - width));
    return { x, y: r.bottom + 6, width, maxHeight: 160, estHeight: 112 };
  }
}

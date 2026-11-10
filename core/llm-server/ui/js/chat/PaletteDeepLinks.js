import SettingLink from './turns/SettingLink.js';
import SystemStatus from '../setup-ui/system/SystemStatus.js';

export default class PaletteDeepLinks {
  constructor(ctx) {
    this._ctx = ctx;
  }

  install() {
    const api = this._ctx.api;
    if (!api || typeof api.onPalette !== 'function') return;
    api.onPalette((msg) => { this.handle(msg).catch(() => {}); });
  }

  async handle(msg) {
    if (!msg || typeof msg !== 'object') return;
    if (msg.type === 'reveal') await this._reveal(msg.target || {});
    else if (msg.type === 'artifact') await this._artifact(msg.conversationId, msg.artifactId);
  }

  async _reveal(target) {
    if (target.tune) {
      new SettingLink(this._ctx).open({ tune: target.tune });
      return;
    }
    if (target.subtab) PaletteDeepLinks.openSubtab(document, target.subtab);
    if (target.selector) await PaletteDeepLinks.reveal(document, target.selector);
  }

  static reveal(doc, selector) {
    return new Promise((resolve) => {
      const attempt = (left) => {
        let el = null;
        try { el = doc.querySelector(selector); } catch (_) { resolve(null); return; }
        if (el) {
          PaletteDeepLinks.openFolds(el);
          PaletteDeepLinks.highlight(PaletteDeepLinks.rowOf(el));
          resolve(el);
          return;
        }
        if (left <= 0) { resolve(null); return; }
        setTimeout(() => attempt(left - 1), 50);
      };
      attempt(40);
    });
  }

  static openSubtab(doc, subtab) {
    const btn = doc.querySelector(`#advSubtabs [data-subtab="${String(subtab).replace(/"/g, '')}"]`);
    if (btn && !btn.classList.contains('active')) btn.click();
  }

  static HIGHLIGHT_CLASS = 'cm-palette-hl';
  static HIGHLIGHT_MS = 2600;

  static highlight(row) {
    const cls = PaletteDeepLinks.HIGHLIGHT_CLASS;
    row.classList.remove(cls);
    void row.offsetWidth;
    row.classList.add(cls);
    if (typeof row.scrollIntoView === 'function') row.scrollIntoView({ block: 'center', behavior: 'smooth' });
    const control = row.matches('input, select, textarea, button') ? row : row.querySelector('select, input:not([type=hidden]), textarea');
    if (control && typeof control.focus === 'function') control.focus({ preventScroll: true });
    setTimeout(() => row.classList.remove(cls), PaletteDeepLinks.HIGHLIGHT_MS);
  }

  static openFolds(el) {
    SystemStatus.unfoldAround(el);
    for (let node = el.parentElement; node; node = node.parentElement) {
      if (node.tagName === 'DETAILS' && !node.open) node.open = true;
    }
  }

  static rowOf(el) {
    return (el.closest && el.closest('.defaults-row, .defaults-opt, .setup-row, .cm-tune-row')) || el;
  }

  async _artifact(conversationId, artifactId) {
    const ctx = this._ctx;
    if (!conversationId) return;
    await ctx.conversation.open(conversationId);
    const r = await ctx.api.conv.artifacts(conversationId);
    const list = (r && r.artifacts) || [];
    const a = list.find((x) => String(x.id) === String(artifactId) || String(x.rootId) === String(artifactId)) || null;
    if (a) ctx.panel.open(a);
  }
}

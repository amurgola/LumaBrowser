import ChatIcons from '../ChatIcons.js';
import ByteFormatter from '../../format/ByteFormatter.js';
import HtmlEscaper from '../../format/HtmlEscaper.js';
import DashboardContext from './DashboardContext.js';
import RegionStaging from '../region/RegionStaging.js';
import TabContext from './TabContext.js';

export default class AttachmentStrip {
  static MAX_CONTEXT_CHIPS = 12;
  static PREVIEW_MIME = /^image\/(png|jpeg|gif|webp|bmp)$/;

  constructor(ctx) {
    this._ctx = ctx;
  }

  add(files) {
    for (const f of files) this._ctx.state.attachments.push(f);
    this.render();
  }

  addContext(item, focus) {
    if (!item || typeof item !== 'object' || !(item.path || item.text)) return;
    const { state } = this._ctx;
    const same = (c) => c.kind === item.kind && c.path === item.path
      && c.startLine === item.startLine && c.endLine === item.endLine;
    state.context = state.context.filter((c) => !same(c));
    state.context.push({ ...item, id: 'ctx-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7) });
    if (state.context.length > AttachmentStrip.MAX_CONTEXT_CHIPS) state.context = state.context.slice(-AttachmentStrip.MAX_CONTEXT_CHIPS);
    this.render();
    if (focus) this._ctx.composer.focus();
  }

  clearContext() {
    if (!this._ctx.state.context.length) return;
    this._ctx.state.context = [];
    this.render();
  }

  render() {
    const { state, root } = this._ctx;
    root.querySelectorAll('[data-cm-attachments]').forEach((strip) => {
      const docsOn = state.docsSource === true;
      if (state.attachments.length === 0 && state.context.length === 0 && !state.tabSuggestion && !docsOn) {
        strip.hidden = true;
        strip.innerHTML = '';
        return;
      }
      strip.hidden = false;
      strip.innerHTML = state.context.map((c) => AttachmentStrip.contextChipHtml(c, true)).join('')
        + (docsOn ? this._ctx.docs.pillHtml() : '')
        + state.attachments.map((f, i) => AttachmentStrip._fileChipHtml(f, i)).join('')
        + (state.tabSuggestion ? TabContext.suggestionHtml(state.tabSuggestion) : '');
      this._wireRemoves(strip);
      this._wireSuggestion(strip);
      this._wireDocs(strip);
    });
    this._ctx.composer.refreshSendState();
  }

  static contextLabel(c) {
    const name = String(c.path || 'selection').split('/').pop();
    if (c.kind !== 'selection' || !c.startLine) return name;
    return name + ':' + c.startLine + (c.endLine && c.endLine !== c.startLine ? '-' + c.endLine : '');
  }

  static contextChipHtml(c, removable) {
    const esc = HtmlEscaper.escape;
    return '<span class="cm-att" title="' + esc(c.path || '') + '">'
      + '<span class="cm-att-ic">' + ChatIcons.doc + '</span>'
      + '<span class="cm-att-name">' + esc(AttachmentStrip.contextLabel(c)) + '</span>'
      + (removable ? '<button class="cm-att-x" data-ctx-rm="' + esc(c.id) + '" type="button" title="Remove">×</button>' : '')
      + '</span>';
  }

  static _fileChipHtml(f, i) {
    if (f.kind === 'region') return RegionStaging.chipHtml(f, i);
    const esc = HtmlEscaper.escape;
    const sz = f.size ? ByteFormatter.bytes(f.size, { zero: '' }) : '';
    const src = AttachmentStrip.previewSrc(f);
    const ic = f.page ? TabContext.iconHtml(f.page.favicon) : (f.dashboard ? DashboardContext.iconHtml() : (f.kind === 'image' ? ChatIcons.image : ChatIcons.doc));
    const what = f.page ? f.page.url : (f.dashboard ? AttachmentStrip._dashboardTitle(f) : (f.kind || 'file'));
    const cls = (f.page ? ' page' : '') + (f.dashboard ? ' dashboard' : '') + (f.error ? ' err' : '') + (src ? ' has-preview' : '');
    return '<span class="cm-att' + cls + '"' + (src ? ' tabindex="0"' : ' title="' + esc(f.error || what + (sz ? ' · ' + sz : '')) + '"') + '>'
      + (src
        ? '<img class="cm-att-thumb" src="' + src + '" alt="">'
          + '<span class="cm-att-preview" aria-hidden="true"><img src="' + src + '" alt=""></span>'
        : '<span class="cm-att-ic">' + ic + '</span>')
      + '<span class="cm-att-name">' + esc(f.name || 'attachment') + '</span>'
      + (sz ? '<span class="cm-att-sz">' + esc(sz) + '</span>' : '')
      + (src ? RegionStaging.imageButtonHtml(f, i) : '')
      + '<button class="cm-att-x" data-att-rm="' + i + '" type="button" title="Remove">×</button>'
      + '</span>';
  }

  static previewSrc(f) {
    if (!f || f.kind !== 'image' || f.error || typeof f.base64 !== 'string' || !f.base64) return '';
    const mime = String(f.mime || 'image/png').toLowerCase();
    if (!AttachmentStrip.PREVIEW_MIME.test(mime) || !/^[A-Za-z0-9+/=\s]+$/.test(f.base64)) return '';
    return 'data:' + mime + ';base64,' + f.base64.replace(/\s+/g, '');
  }

  static _dashboardTitle(f) {
    const titles = ((f.dashboard && f.dashboard.widgets) || []).map((w) => w.title).filter(Boolean);
    return titles.length ? 'Dashboard: ' + titles.join(', ') : 'Dashboard';
  }

  _wireSuggestion(strip) {
    const go = strip.querySelector('[data-tab-suggest]');
    if (go) go.addEventListener('click', () => this._ctx.tabs.acceptSuggestion());
    const x = strip.querySelector('[data-tab-suggest-x]');
    if (x) x.addEventListener('click', () => this._ctx.tabs.dismissSuggestion());
  }

  _wireDocs(strip) {
    const off = strip.querySelector('[data-docs-off]');
    if (off) off.addEventListener('click', () => this._ctx.docs.disable());
  }

  _wireRemoves(strip) {
    const { state } = this._ctx;
    strip.querySelectorAll('[data-att-rm]').forEach((btn) => btn.addEventListener('click', () => {
      const i = Number(btn.dataset.attRm);
      if (!Number.isFinite(i)) return;
      state.attachments.splice(i, 1);
      this.render();
    }));
    strip.querySelectorAll('[data-att-region]').forEach((btn) => btn.addEventListener('click', () => {
      const i = Number(btn.dataset.attRegion);
      if (Number.isFinite(i)) this._ctx.regions.edit(i);
    }));
    strip.querySelectorAll('[data-ctx-rm]').forEach((btn) => btn.addEventListener('click', () => {
      state.context = state.context.filter((c) => c.id !== btn.dataset.ctxRm);
      this.render();
    }));
  }
}

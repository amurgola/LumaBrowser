import ChatIcons from '../ChatIcons.js';
import ShareLinks from '../common/ShareLinks.js';
import MonacoLanguages from '../../monaco/MonacoLanguages.js';
import ArtifactDownloader from './ArtifactDownloader.js';
import PanelDocuments from './PanelDocuments.js';

export default class ArtifactPanel {
  static MEDIA = {
    image: { doc: PanelDocuments.image, title: 'Image', fail: 'Failed to load image.' },
    video: { doc: PanelDocuments.video, title: 'Video', fail: 'Failed to load video.' },
    audio: { doc: PanelDocuments.audio, title: 'Audio', fail: 'Failed to load audio.' },
  };

  constructor(ctx) {
    this._ctx = ctx;
  }

  build() {
    const R = this._ctx.resonant;
    this._registerHeader(R);
    this._el().innerHTML =
      '<div res-include="apHead"></div>'
      + '<div class="cm-ap-body" data-layout="iframe">'
      +   '<div class="cm-ap-monaco" data-monaco-host></div>'
      +   '<iframe class="cm-ap-frame" referrerpolicy="no-referrer" '
      +     'sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-modals"></iframe>'
      + '</div>';
    R.processIncludes(this._el());
    PanelDocuments.installScrollbar(this._frame());
  }

  open(a) {
    if (!a) return undefined;
    const type = a.type || 'html';
    if (ArtifactPanel.MEDIA[type]) return this._openMedia(a, type);
    if (type === 'code') return this._openCode(a);
    if (type === 'html') return this._openHtml(a);
    return this._openServed(a, type);
  }

  stream(p) {
    if (!p) return;
    const type = p.type || 'html';
    this._setPanel({ id: null, title: p.title || 'Artifact', type, url: null, building: true, language: p.language || null });
    this.title(p.title, type, true);
    this._setButtons(false, false);
    this.setOpen(true);
    const c = p.content || '';
    if (type === 'code') { this._streamCode(p, c); return; }
    if (type === 'html') { this._streamHtml(c); return; }
    this._streamFrame(p, type, c);
  }

  async openWorkspaceFile(relPath) {
    const { api, state } = this._ctx;
    const ce = this._ctx.codeEditor();
    if (relPath && this._ctx.codeEditorDocked()) { ce.openPath(relPath); return; }
    if (!(api.chat && api.chat.readWorkspaceFile) || !state.activeId || !relPath) return;
    const r = await this._readWorkspaceFile(relPath);
    if (!r) return;
    this._setPanel({ id: null, title: relPath, type: 'code', url: null, building: false, language: null });
    this.title(relPath, 'file', false);
    this._setButtons(false, false);
    this.setOpen(true);
    this.setLayout('monaco');
    this._editor().setReadOnly(true);
    const more = r.truncated ? '\n\n… (view truncated: file continues on disk)' : '';
    await this._editor().write((r.content || '') + more, MonacoLanguages.resolveLanguage(null, relPath));
    this._editor().revealTop();
  }

  close() {
    this._ctx.state.panel = null;
    this.setOpen(false);
    const frame = this._frame();
    if (frame) { frame.removeAttribute('srcdoc'); frame.src = 'about:blank'; }
    this.setLayout('iframe');
  }

  setOpen(on) {
    this._ctx.root.classList.toggle('cm-has-panel', on);
    document.body.classList.toggle('cm-panel-open', on);
  }

  setLayout(layout) {
    const body = this._el() && this._el().querySelector('.cm-ap-body');
    if (!body) return;
    body.dataset.layout = layout;
    if (layout === 'monaco' || layout === 'split') this._editor().relayoutSoon();
  }

  title(title, type, building) {
    const el = this._el();
    el.querySelector('.cm-ap-title').textContent = (title || 'Artifact') + (type ? '  ·  ' + type : '');
    const badge = el.querySelector('.cm-ap-badge');
    if (badge) badge.hidden = !building;
    const share = el.querySelector('.cm-ap-share');
    if (!share) return;
    const { state } = this._ctx;
    share.hidden = !state.shareAvail;
    share.disabled = !(state.panel && state.panel.id);
    this._ctx.share.refreshStatus().then((ok) => { if (share.isConnected) share.hidden = !ok; });
  }

  clearBuilding() {
    const p = this._ctx.state.panel;
    if (!p || !p.building) return;
    p.building = false;
    this.title(p.title, p.type, false);
  }

  _registerHeader(R) {
    R.registerTemplate('apHead',
      '<div class="cm-ap-head">'
      + '<span class="cm-ap-ic">' + ChatIcons.doc + '</span>'
      + '<span class="cm-ap-title">Artifact</span>'
      + '<span class="cm-ap-badge" hidden>building…</span>'
      + '<button class="cm-ap-btn cm-ap-share" res-onclick="res.apShare" title="Copy share link" disabled hidden>' + ChatIcons.link + '</button>'
      + '<button class="cm-ap-btn cm-ap-dl" res-onclick="res.apDl" title="Download artifact" disabled>' + ChatIcons.download + '</button>'
      + '<button class="cm-ap-btn cm-ap-pop" res-onclick="res.apPop" title="Open in a full browser tab" disabled>' + ChatIcons.expand + '</button>'
      + '<button class="cm-ap-btn cm-ap-close" res-onclick="res.apClose" title="Close panel">' + ChatIcons.x + '</button>'
      + '</div>');
    R.handler('apShare', () => this._share());
    R.handler('apDl', () => ArtifactDownloader.download(this._ctx.api, this._ctx.state.panel));
    R.handler('apPop', () => this._popOut());
    R.handler('apClose', () => this.close());
  }

  async _share() {
    const p = this._ctx.state.panel;
    if (!p || !p.id) return;
    const btn = this._el().querySelector('.cm-ap-share');
    const url = await this._ctx.share.copyLink('artifact', p.id, p.title);
    if (btn) ShareLinks.flash(btn, url);
  }

  _popOut() {
    const p = this._ctx.state.panel;
    if (p && p.id) { try { this._ctx.api.artifact.open(p.id); } catch (_) {} }
  }

  async _openMedia(a, type) {
    const spec = ArtifactPanel.MEDIA[type];
    this._setPanel({ id: a.id, title: a.title || spec.title, type, url: a.url || null, building: true, b64: null, mime: null });
    this.title(this._ctx.state.panel.title, type, true);
    this._setButtons(!!a.url, false);
    const frame = this._frame();
    frame.removeAttribute('src');
    frame.srcdoc = spec.doc(null, null, true);
    this.setOpen(true);
    const entry = await this._ctx.mediaCache.load(a.id);
    if (!this._isShowing(a.id)) return;
    if (!entry) { frame.srcdoc = spec.doc(null, null, false, spec.fail); return; }
    Object.assign(this._ctx.state.panel, { b64: entry.b64, mime: entry.mime, building: false });
    this.title(this._ctx.state.panel.title, type, false);
    this._setButtons(!!a.url, true);
    frame.srcdoc = spec.doc(entry.b64, entry.mime, false);
  }

  async _openCode(a) {
    this._setPanel({ id: a.id, title: a.title || 'Code', type: 'code', url: a.url || null, building: true, language: a.language || null });
    this.title(this._ctx.state.panel.title, 'code', true);
    this._setButtons(!!a.url, true);
    this.setLayout('monaco');
    this._editor().setReadOnly(true);
    this.setOpen(true);
    const art = await this._fetchArtifact(a.id);
    const content = art ? art.content || '' : '';
    const language = (art && art.language) || a.language || 'plaintext';
    if (!this._isShowing(a.id)) return;
    const panel = this._ctx.state.panel;
    panel.building = false;
    panel.language = language;
    this.title(panel.title, 'code', false);
    this._editor().write(content, MonacoLanguages.resolveLanguage(language, panel.title));
  }

  async _openHtml(a) {
    this._setPanel({ id: a.id, title: a.title || 'HTML', type: 'html', url: a.url || null, building: true });
    this.title(this._ctx.state.panel.title, 'html', true);
    this._setButtons(!!a.url, true);
    this.setLayout('split');
    this.setOpen(true);
    const frame = this._frame();
    frame.removeAttribute('srcdoc');
    if (a.url) this._loadServed(frame, a.url);
    else frame.srcdoc = PanelDocuments.building('html', '');
    const art = await this._fetchArtifact(a.id);
    if (!this._isShowing(a.id)) return;
    this._ctx.state.panel.building = false;
    this.title(this._ctx.state.panel.title, 'html', false);
    this._editor().write(art ? art.content || '' : '', 'html');
    this._editor().setReadOnly(false);
  }

  _openServed(a, type) {
    if (!a.url) return;
    this._setPanel({ id: a.id, title: a.title || 'Artifact', type, url: a.url, building: false });
    this.title(this._ctx.state.panel.title, type, false);
    this._setButtons(true, true);
    this.setLayout('iframe');
    const frame = this._frame();
    frame.removeAttribute('srcdoc');
    this._loadServed(frame, a.url);
    this.setOpen(true);
  }

  _streamCode(p, c) {
    this.setLayout('monaco');
    this._editor().setReadOnly(true);
    this._editor().write(c || '', MonacoLanguages.resolveLanguage(p.language, p.title));
  }

  _streamHtml(c) {
    this.setLayout('split');
    this._editor().setReadOnly(true);
    this._editor().write(c || '', 'html');
    const frame = this._frame();
    frame.removeAttribute('src');
    frame.srcdoc = c || PanelDocuments.building('html', '');
  }

  _streamFrame(p, type, c) {
    this.setLayout('iframe');
    const frame = this._frame();
    frame.removeAttribute('src');
    if (p.phase === 'open' && !c) frame.srcdoc = PanelDocuments.building(type, '');
    else if (type === 'svg') frame.srcdoc = PanelDocuments.svg(c);
    else frame.srcdoc = PanelDocuments.building(type, c);
  }

  async _readWorkspaceFile(relPath) {
    const { api, state } = this._ctx;
    let r = null;
    try { r = await api.chat.readWorkspaceFile({ conversationId: state.activeId, path: relPath }); } catch (_) {}
    if (r && r.success) return r;
    console.warn('[chat] view file failed:', (r && r.error) || 'no response');
    return null;
  }

  async _fetchArtifact(id) {
    try {
      const r = await this._ctx.api.artifact.get(id);
      return (r && r.success && r.artifact) || null;
    } catch (_) {
      return null;
    }
  }

  _loadServed(frame, url) {
    frame.src = 'about:blank';
    frame.src = url + (url.indexOf('?') === -1 ? '?t=' : '&t=') + Date.now();
  }

  _setPanel(panel) {
    this._ctx.state.panel = panel;
  }

  _isShowing(id) {
    const p = this._ctx.state.panel;
    return !!p && p.id === id;
  }

  _setButtons(popEnabled, downloadEnabled) {
    this._el().querySelector('.cm-ap-pop').disabled = !popEnabled;
    this._el().querySelector('.cm-ap-dl').disabled = !downloadEnabled;
  }

  _el() {
    return this._ctx.els.panel;
  }

  _frame() {
    return this._el() && this._el().querySelector('.cm-ap-frame');
  }

  _editor() {
    return this._ctx.panelEditor;
  }
}

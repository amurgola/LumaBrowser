import ChatIcons from '../ChatIcons.js';

export default class MainColumn {
  static NEAR_BOTTOM_PX = 80;

  constructor(ctx) {
    this._ctx = ctx;
  }

  build() {
    const { els } = this._ctx;
    els.main.innerHTML = MainColumn._markup();
    els.title = els.main.querySelector('.cm-title-btn');
    els.title.addEventListener('click', (e) => this._onTitleClick(e));
    els.artifactsBtn = els.main.querySelector('.cm-topbar-artifacts');
    els.artifactsBtn.addEventListener('click', () => this._ctx.artsSidebar.toggleScoped());
    els.scroll = els.main.querySelector('.cm-scroll');
    els.scroll.addEventListener('scroll', () => this._onScroll());
    window.addEventListener('resize', () => this._ctx.previewSlot.poke());
    els.scroll.addEventListener('click', (e) => this._ctx.turnActions.onClick(e));
    els.scroll.addEventListener('click', (e) => this._ctx.tableSort.onClick(e));
    els.scroll.addEventListener('mouseover', (e) => this._ctx.turnActions.onHover(e));
    this._ctx.codeBar.install();
    els.jump = els.main.querySelector('.cm-jump-latest');
    els.jump.addEventListener('click', () => { this._ctx.state.autoScrollPaused = false; this.pinBottom(); this.updateJumpPill(); });
  }

  titleText() {
    const span = this._ctx.els.title && this._ctx.els.title.querySelector('span');
    return span ? span.textContent : '';
  }

  setTitle(text) {
    const span = this._ctx.els.title && this._ctx.els.title.querySelector('span');
    if (span) span.textContent = text;
  }

  showTitle(text) {
    this._ctx.els.title.style.display = '';
    this.setTitle(text);
  }

  hideTitle() {
    this._ctx.els.title.style.display = 'none';
  }

  showStaticView(title) {
    const { els } = this._ctx;
    this.showTitle(title);
    if (els.artifactsBtn) els.artifactsBtn.style.display = 'none';
    this.clearComposerBar();
    els.scroll.innerHTML = '';
  }

  clearComposerBar() {
    const bar = this._ctx.els.composerBar;
    bar.style.display = 'none';
    bar.innerHTML = '';
  }

  syncActiveTitle() {
    const { state } = this._ctx;
    if (!state.activeId || state.activeTaskId || state.activeTriggerId) return;
    const c = state.conversations.find((x) => x.id === state.activeId);
    if (c && c.title) this.setTitle(c.title);
  }

  pinBottom() {
    const scroll = this._ctx.els.scroll;
    scroll.scrollTop = scroll.scrollHeight;
  }

  maybeScroll() {
    if (!this._ctx.state.autoScrollPaused) this.pinBottom();
    this.updateJumpPill();
  }

  updateJumpPill() {
    const { els, state } = this._ctx;
    if (els.jump) els.jump.hidden = !(state.streaming && state.autoScrollPaused);
  }

  static _markup() {
    return '<div class="cm-topbar">'
      +   '<button class="cm-title-btn" style="display:none"><span>New chat</span>' + ChatIcons.chevron + '</button>'
      +   '<button type="button" class="cm-topbar-artifacts" style="display:none" title="View and manage artifacts in this conversation">'
      +     ChatIcons.doc + '<span class="cm-topbar-artifacts-label">Artifacts</span><span class="cm-topbar-artifacts-count" data-cm-art-count></span></button>'
      + '</div>'
      + '<div class="cm-scroll"></div>'
      + '<button type="button" class="cm-jump-latest" hidden><span>New text</span>' + ChatIcons.chevron + '</button>';
  }

  _onTitleClick(e) {
    const { state } = this._ctx;
    if (state.activeTaskId) {
      const t = state.schedTasks.find((x) => x.id === state.activeTaskId);
      if (t) this._ctx.taskMenu.open(e, t);
      return;
    }
    if (state.activeTriggerId) {
      const t = state.triggers.find((x) => x.id === state.activeTriggerId);
      if (t) this._ctx.triggerMenu.open(e, t);
      return;
    }
    if (!state.activeId) return;
    const c = state.conversations.find((x) => x.id === state.activeId) || { id: state.activeId, title: this.titleText() };
    this._ctx.convMenu.open(e, c);
  }

  _onScroll() {
    const { els, state } = this._ctx;
    const s = els.scroll;
    state.autoScrollPaused = !(s.scrollHeight - s.scrollTop - s.clientHeight < MainColumn.NEAR_BOTTOM_PX);
    this.updateJumpPill();
    this._ctx.previewSlot.poke();
  }
}

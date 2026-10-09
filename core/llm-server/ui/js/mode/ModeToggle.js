import SetupDeepLink from './SetupDeepLink.js';
import PlanExplainerOpener from './PlanExplainerOpener.js';

export default class ModeToggle {
  static MODES = ['setup', 'chat', 'code'];

  constructor({ doc = document, win = window, api = window.llmDiagAPI, chatMode = null, codeEditor = null, setupNav = null } = {}) {
    this._doc = doc;
    this._win = win;
    this._api = api;
    this._chatMode = chatMode;
    this._codeEditor = codeEditor;
    this._setupNav = setupNav;
    this._current = 'setup';
    this._chatMounted = false;
    this._codeMounted = false;
    this._codeConversationId = null;
  }

  setSetupNav(setupNav) {
    this._setupNav = setupNav;
  }

  get current() {
    return this._current;
  }

  start() {
    this._findElements();
    this._listen();
    this._listenToHost();
    return this._boot();
  }

  applyMode(mode, persist) {
    if (mode === 'code' && !this._codeConversationId) mode = 'chat';
    this._current = mode === 'chat' ? 'chat' : (mode === 'code' ? 'code' : 'setup');
    this._paintSlider();
    const docked = this._layout();
    this._applyChat(docked);
    this._applyCode();
    if (persist && this._current !== 'code' && this._api && this._api.setUiMode) this._api.setUiMode(this._current);
    try { this._win.dispatchEvent(new CustomEvent('luma-mode-changed', { detail: this._current })); } catch (_) {}
  }

  openSetupPage(view) {
    if (!view) return;
    this.applyMode('setup', true);
    if (this._setupNav) { try { this._setupNav.go(view); } catch (_) {} }
  }

  _findElements() {
    this._slider = this._doc.getElementById('modeSlider');
    this._setupRoot = this._doc.getElementById('setupRoot');
    this._chatRoot = this._doc.getElementById('chatRoot');
    this._codeRoot = this._doc.getElementById('codeRoot');
    this._codeButton = this._slider.querySelector('button[data-mode="code"]');
  }

  _paintSlider() {
    for (const button of this._slider.querySelectorAll('button')) button.classList.toggle('active', button.dataset.mode === this._current);
  }

  _layout() {
    const chat = this._current === 'chat';
    const code = this._current === 'code';
    const docked = code && this._chatMounted && !!this._codeEditor && this._codeEditor.wantsChatDock();
    this._setupRoot.hidden = chat || code;
    this._chatRoot.hidden = !(chat || docked);
    this._doc.body.classList.toggle('code-split', docked);
    this._doc.body.classList.toggle('chat-mode', chat);
    return docked;
  }

  _applyChat(docked) {
    if (!this._chatMode) return;
    if (this._current === 'chat') {
      if (!this._chatMounted) { this._chatMode.mount(this._chatRoot, this._api); this._chatMounted = true; }
      this._chatMode.show();
    } else if (!docked && this._chatMounted) {
      this._chatMode.hide();
    }
  }

  _applyCode() {
    const code = this._current === 'code';
    if (code && this._codeEditor) {
      if (!this._codeMounted) { this._codeEditor.mount(this._codeRoot, this._api); this._codeMounted = true; }
      this._codeEditor.show(this._codeConversationId);
    } else if (!code && this._codeMounted && this._codeEditor) {
      this._codeEditor.hide();
    } else if (!code && this._codeRoot) {
      this._codeRoot.hidden = true;
    }
  }

  _listen() {
    this._slider.addEventListener('click', (e) => {
      const button = e.target.closest('button[data-mode]');
      if (button && button.dataset.mode !== this._current) this.applyMode(button.dataset.mode, true);
    });
    this._win.addEventListener('hashchange', () => this._onHashChange());
    this._win.addEventListener('luma-switch-mode', (e) => {
      if (ModeToggle.MODES.includes(e && e.detail)) this.applyMode(e.detail, true);
    });
    this._win.addEventListener('luma-code-surface', (e) => this._onCodeSurface((e && e.detail) || {}));
    this._win.addEventListener('luma-code-dock', () => { if (this._current === 'code') this.applyMode('code', false); });
  }

  _onHashChange() {
    const hash = this._win.location.hash;
    const page = SetupDeepLink.pageFromHash(hash);
    if (page) this.openSetupPage(page);
    else if (SetupDeepLink.isChat(hash)) this.applyMode('chat', true);
  }

  _onCodeSurface(detail) {
    const available = !!detail.available && !!detail.conversationId;
    this._codeConversationId = available ? detail.conversationId : null;
    this._codeButton.hidden = !available;
    if (available) this._codeButton.title = detail.root || '';
    if (!available && this._current === 'code') this.applyMode('chat', false);
    else if (available && this._current === 'code' && this._codeEditor) this._codeEditor.show(this._codeConversationId);
  }

  _listenToHost() {
    const api = this._api;
    try {
      if (api && api.onShowChat) api.onShowChat(() => this.applyMode('chat', true));
      if (api && api.onShowSetup) api.onShowSetup((payload) => this._onShowSetup(payload));
    } catch (_) {}
  }

  _onShowSetup(payload) {
    this.applyMode('setup', true);
    if (payload && payload.page) this.openSetupPage(payload.page);
    if (payload && payload.expand === 'plan') PlanExplainerOpener.open(this._doc);
  }

  async _boot() {
    const mode = await this._persistedMode();
    this.applyMode(mode, false);
    const hash = this._win.location.hash;
    const page = SetupDeepLink.pageFromHash(hash);
    if (page) this.openSetupPage(page);
    else if (SetupDeepLink.isChat(hash)) this.applyMode('chat', false);
    if (mode === 'setup') await this._consumeExpandHint();
  }

  async _persistedMode() {
    try {
      if (this._api && this._api.getUiMode) return await this._api.getUiMode();
    } catch (_) {}
    return 'setup';
  }

  async _consumeExpandHint() {
    if (!this._api || !this._api.consumePendingSetupExpand) return;
    try {
      if (await this._api.consumePendingSetupExpand() === 'plan') PlanExplainerOpener.open(this._doc);
    } catch (_) {}
  }
}

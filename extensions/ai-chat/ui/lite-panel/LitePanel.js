import ChatPanelApi from '../ChatPanelApi.js';
import LiteChatReducer from './LiteChatReducer.js';
import LiteConfirm from './LiteConfirm.js';
import LiteHistoryList from './LiteHistoryList.js';
import LiteModelPicker from './LiteModelPicker.js';
import LiteNoModelNotice from './LiteNoModelNotice.js';
import LitePanelStyles from './LitePanelStyles.js';
import LiteServerBadge from './LiteServerBadge.js';
import LiteThreadView from './LiteThreadView.js';
import LiteToolsPopover from './LiteToolsPopover.js';
import RunZoom from './RunZoom.js';

export default class LitePanel {
  static HISTORY_LIMIT = 50;

  constructor(opts = {}) {
    this.api = opts.api || (window.ipcBridge ? ChatPanelApi.build(window.ipcBridge) : null);
    if (!this.api) throw new Error('LitePanel: a chat api (window.ipcBridge) is required');
    this._initState();
    LitePanelStyles.install(document);
    this._bindDom();
    this._buildParts(opts);
    this._bindEvents();
    this._subscribe();
    this._loadConversations();
  }

  async checkLlmAvailability() {
    try {
      const res = await this.api.listModels();
      this.models = (res && res.models) || [];
      await this._pickModelRef(res);
      this._modelPicker.render(this.models, this.modelRef);
      this._applyServerState(await this._serverState());
      return this.models.length > 0;
    } catch (_) {
      this._applyServerState({ status: 'error', configured: this.models.length > 0, model: null, label: 'Could not read the LLM status' });
      return false;
    }
  }

  destroy() {
    this._modelPicker.destroy();
    for (const key of ['_unsubChat', '_unsubState']) {
      if (!this[key]) continue;
      try { this[key](); } catch (_) {}
      this[key] = null;
    }
  }

  _initState() {
    this.state = LiteChatReducer.createInitialState();
    this.thread = [];
    this.models = [];
    this.modelRef = null;
    this.disabledTools = [];
    this.serverState = null;
    this.reqId = null;
    this._conversations = [];
    this._renderQueued = false;
    this._newConversationThisTurn = false;
  }

  _bindDom() {
    const q = (id) => document.getElementById(id);
    this.panel = q('aiChatPanel');
    this.toggleBtn = q('aiChatToggle');
    this.closeBtn = q('aiChatClose');
    this.messagesEl = q('aiChatMessages');
    this.historyListEl = q('aiChatHistoryList');
    this.inputEl = q('aiChatInput');
    this.sendBtn = q('aiChatSend');
    this.stopBtn = q('aiChatStop');
    this.contextEl = q('aiChatContext');
    this.modelSelect = q('aiChatModel');
    this.statusEl = q('aiChatStatus');
    this.newBtn = q('aiChatNewConversation');
    this.deleteBtn = q('aiChatClear');
  }

  _buildParts(opts) {
    const q = (id) => document.getElementById(id);
    this._modelPicker = new LiteModelPicker(this.modelSelect, (ref) => this._onModelPicked(ref));
    this._thread = new LiteThreadView({ messagesEl: this.messagesEl, api: this.api });
    this._tools = new LiteToolsPopover({
      button: q('aiChatTools'),
      pop: q('aiChatToolsPop'),
      api: this.api,
      getDisabled: () => this.disabledTools,
      onToggle: (name, enabled) => this._setToolEnabled(name, enabled),
    });
    this._confirm = new LiteConfirm({
      modal: q('aiChatConfirmModal'),
      message: q('aiChatConfirmMessage'),
      okBtn: q('aiChatConfirmOkBtn'),
      cancelBtn: q('aiChatConfirmCancelBtn'),
    });
    this._badge = new LiteServerBadge({ toggleBtn: this.toggleBtn, stateDot: q('aiChatStateDot'), contextEl: this.contextEl });
    this._notice = new LiteNoModelNotice({
      messagesEl: this.messagesEl, inputEl: this.inputEl, sendBtn: this.sendBtn, onOpenSetup: () => this._openSetup(),
    });
    this._zoom = new RunZoom({
      tabAPI: opts.tabAPI || window.tabAPI || null,
      getActiveTabId: opts.getActiveTabId || LitePanel._shellActiveTabId,
    });
  }

  _bindEvents() {
    const on = (el, type, fn) => { if (el) el.addEventListener(type, fn); };
    on(this.toggleBtn, 'click', () => this._togglePanel());
    on(this.closeBtn, 'click', () => this._closePanel());
    on(this.sendBtn, 'click', () => this._onSend());
    on(this.stopBtn, 'click', () => this._onStop());
    on(this.newBtn, 'click', () => this._startNewConversation());
    on(this.deleteBtn, 'click', () => this._deleteActiveConversation());
    on(this.inputEl, 'keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this._onSend(); }
    });
    on(document.getElementById('aiChatTools'), 'click', (e) => { e.stopPropagation(); this._tools.toggle(); });
    on(document.getElementById('aiChatToolsPop'), 'click', (e) => e.stopPropagation());
    document.addEventListener('click', () => this._tools.close());
    document.addEventListener('keydown', (e) => this._onEscape(e));
  }

  _subscribe() {
    this._unsubChat = this.api.onChatEvent((evt) => this._onChatEvent(evt));
    if (typeof this.api.onState === 'function') this._unsubState = this.api.onState((st) => this._applyServerState(st));
  }

  _onEscape(e) {
    if (e.key !== 'Escape') return;
    if (this._tools.isOpen()) this._tools.close();
    else if (this._confirm.isOpen()) this._confirm.hide();
    else if (this.panel && this.panel.classList.contains('active')) this._closePanel();
  }

  _onModelPicked(ref) {
    if (!ref) return;
    this.modelRef = ref;
    LitePanel._quietly(() => this.api.setLastModelRef(ref));
  }

  _togglePanel() {
    if (!this.panel) return;
    if (this.serverState && this.serverState.configured === false) {
      this._openSetup();
      return;
    }
    const open = this.panel.classList.toggle('active');
    if (this.toggleBtn) this.toggleBtn.classList.toggle('is-open', open);
    if (open && this.inputEl) this.inputEl.focus();
    if (!open) this._modelPicker.close();
  }

  _closePanel() {
    if (this.panel) this.panel.classList.remove('active');
    if (this.toggleBtn) this.toggleBtn.classList.remove('is-open');
    this._tools.close();
    this._modelPicker.close();
  }

  _openSetup() {
    LitePanel._quietly(() => this.api.openSetup({ expand: 'models' }));
  }

  _setToolEnabled(name, enabled) {
    const set = new Set(this.disabledTools);
    if (enabled) set.delete(name); else set.add(name);
    this.disabledTools = [...set];
    const convId = this.state.conversationId;
    if (convId && this.api.conv && this.api.conv.setDisabledTools) {
      LitePanel._quietly(() => this.api.conv.setDisabledTools(convId, this.disabledTools));
    }
  }

  async _pickModelRef(res) {
    if (this.modelRef && this.models.some((m) => m.ref === this.modelRef)) return;
    const last = await Promise.resolve(this.api.getLastModelRef()).catch(() => null);
    const lastRef = last && (last.ref || last.modelRef || (typeof last === 'string' ? last : null));
    this.modelRef = (lastRef && this.models.some((m) => m.ref === lastRef))
      ? lastRef
      : ((res && res.defaultRef) || (this.models[0] && this.models[0].ref) || null);
  }

  async _serverState() {
    let st = null;
    if (typeof this.api.getState === 'function') st = await Promise.resolve(this.api.getState()).catch(() => null);
    if (st && st.success !== false) return st;
    const available = this.models.length > 0;
    return { status: available ? 'ready' : 'off', configured: available, model: this.modelRef, label: available ? 'Ready' : 'No model configured' };
  }

  _applyServerState(st) {
    if (!st || typeof st !== 'object') return;
    this.serverState = st;
    this._badge.paint(st, this._contextLabel());
    this._renderNotice();
  }

  _contextLabel() {
    if (this.modelSelect) return null;
    const m = this.models.find((x) => x.ref === this.modelRef);
    return m ? (m.label || m.ref) : '';
  }

  _renderNotice() {
    this._notice.render(!this.serverState || this.serverState.configured !== false, this.state.running);
  }

  async _loadConversations() {
    try {
      const res = await this.api.conv.list({ limit: LitePanel.HISTORY_LIMIT });
      this._conversations = (res && res.conversations) || (Array.isArray(res) ? res : []);
      this._renderHistory();
    } catch (err) {
      console.error('[lite-panel] conv.list failed:', err);
    }
  }

  _renderHistory() {
    LiteHistoryList.render(this.historyListEl, this._conversations, this.state.conversationId, (id) => this._openConversation(id));
  }

  async _openConversation(conversationId) {
    if (this.state.running) return;
    try {
      const res = await this.api.conv.messages(conversationId);
      const messages = (res && res.messages) || (Array.isArray(res) ? res : []);
      this.thread = messages
        .filter((m) => (m.role === 'user' || m.role === 'assistant') && m.content)
        .map((m) => ({ role: m.role, content: m.content }));
      this.state = { ...LiteChatReducer.createInitialState(), conversationId };
      const conv = this._conversations.find((c) => c.id === conversationId);
      this.disabledTools = (conv && Array.isArray(conv.disabledTools)) ? conv.disabledTools.slice() : [];
      this._showConversation();
    } catch (err) {
      console.error('[lite-panel] conv.messages failed:', err);
    }
  }

  _startNewConversation() {
    if (this.state.running) return;
    this.thread = [];
    this.state = LiteChatReducer.createInitialState();
    this.disabledTools = [];
    this._showConversation();
    if (this.inputEl) this.inputEl.focus();
  }

  _showConversation() {
    this._tools.refreshIfOpen();
    this._thread.showThread(this.thread);
    this._renderNotice();
    this._renderHistory();
  }

  _deleteActiveConversation() {
    const id = this.state.conversationId;
    if (!id || this.state.running) return;
    this._confirm.show('Delete this conversation? This cannot be undone.', async () => {
      try {
        await this.api.conv.delete(id);
        this._startNewConversation();
        await this._loadConversations();
      } catch (err) {
        console.error('[lite-panel] conv.delete failed:', err);
      }
    });
  }

  async _onSend() {
    const text = this.inputEl ? this.inputEl.value.trim() : '';
    if (!text || this.state.running) return;
    if (!(await this._ensureModel())) return;
    const context = this._pushUserMessage(text);
    this._beginTurn();
    await this._requestTurn(context, text);
  }

  async _ensureModel() {
    if (this.modelRef) return true;
    await this.checkLlmAvailability();
    if (this.modelRef) return true;
    this._setStatus('No model configured. Open the LLM tab to set one up.');
    return false;
  }

  _pushUserMessage(text) {
    this.thread.push({ role: 'user', content: text });
    this._thread.appendMessage('user', text);
    if (this.inputEl) this.inputEl.value = '';
    return this.thread.map((m) => ({ role: m.role, content: m.content }));
  }

  _beginTurn() {
    this._newConversationThisTurn = !this.state.conversationId;
    this.state = LiteChatReducer.startTurn(this.state);
    this.reqId = 'lite-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
    this._thread.startTurn();
    this._setRunning(true);
  }

  async _requestTurn(context, text) {
    try {
      const res = await this.api.chat2({
        requestId: this.reqId,
        conversationId: this.state.conversationId || undefined,
        modelRef: this.modelRef,
        messages: context,
        userMessage: text,
        agent: true,
        tools: true,
        disabledTools: this.disabledTools,
      });
      if (res && res.success === false) this._failTurn({ message: res.error || 'request failed', ...res });
    } catch (err) {
      this._failTurn({ message: (err && err.message) || 'request failed' });
    }
  }

  _failTurn(payload) {
    this.state = LiteChatReducer.reduce(this.state, { type: 'error', payload });
    this._finishTurn();
  }

  async _onStop() {
    try { await this.api.chatAbort(); } catch (_) {}
  }

  _onChatEvent(evt) {
    if (!evt || evt.requestId !== this.reqId) return;
    this.state = LiteChatReducer.reduce(this.state, evt);
    this._scheduleRender();
    if (evt.type === 'done' || evt.type === 'error') this._finishTurn();
  }

  _finishTurn() {
    this._setRunning(false);
    this._renderStreaming();
    if (this.state.content) this.thread.push({ role: 'assistant', content: this.state.content });
    this._refreshHistoryAfterTurn();
  }

  _refreshHistoryAfterTurn() {
    const convId = this.state.conversationId;
    if (!convId || !this._newConversationThisTurn) {
      this._loadConversations();
      return;
    }
    this._newConversationThisTurn = false;
    Promise.resolve(this.api.conv.autotitle(convId))
      .then(() => this._loadConversations())
      .catch(() => this._loadConversations());
  }

  _setRunning(running) {
    if (this.sendBtn) this.sendBtn.style.display = running ? 'none' : '';
    if (this.stopBtn) this.stopBtn.style.display = running ? '' : 'none';
    if (this.inputEl) this.inputEl.disabled = running;
    this._zoom.set(running);
    if (!running) this._setStatus('');
  }

  _scheduleRender() {
    if (this._renderQueued) return;
    this._renderQueued = true;
    const paint = () => { this._renderQueued = false; this._renderStreaming(); };
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(paint);
    else setTimeout(paint, 16);
  }

  _renderStreaming() {
    this._setStatus(this.state.running ? LiteChatReducer.statusLabel(this.state.statusPhase) : '');
    this._thread.renderTurn(this.state);
  }

  _setStatus(text) {
    if (this.statusEl) this.statusEl.textContent = text || '';
  }

  static _shellActiveTabId() {
    if (typeof activeTabId !== 'undefined') return activeTabId;
    return typeof window.activeTabId !== 'undefined' ? window.activeTabId : null;
  }

  static _quietly(fn) {
    try { Promise.resolve(fn()).catch(() => {}); } catch (_) {}
  }
}

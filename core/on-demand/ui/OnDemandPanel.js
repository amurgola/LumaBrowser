import PanelPreferences from './PanelPreferences.js';
import PanelStatus from './PanelStatus.js';
import PointerDrag from './PointerDrag.js';
import ReplyStream from './ReplyStream.js';
import Transcript from './Transcript.js';
import OnDemandVoice from './voice/OnDemandVoice.js';

export default class OnDemandPanel {
  static ABORT_WAIT_TRIES = 80;
  static ABORT_WAIT_MS = 100;

  constructor(win, doc) {
    this._win = win;
    this._doc = doc;
    this._api = win.onDemandAPI;
    this._el = OnDemandPanel.elements(doc);
    this._prefs = new PanelPreferences(win.localStorage);
    this._status = new PanelStatus(this._el);
    this._transcript = new Transcript(this._el.log);
    this._state = null;
    this._tabId = null;
    this._convId = null;
    this._streaming = false;
    this._reqId = null;
    this._reply = null;
    this._voice = null;
  }

  static elements(doc) {
    const $ = (id) => doc.getElementById(id);
    return {
      tile: $('tile'), tileDot: $('tileDot'), panel: $('panel'), head: $('head'),
      live: $('liveBadge'), pageTitle: $('pageTitle'), model: $('modelLabel'),
      speak: $('btnSpeak'), close: $('btnClose'), log: $('log'), hint: $('hint'),
      mic: $('btnMic'), txt: $('txt'), send: $('btnSend'),
    };
  }

  start() {
    this._createVoice();
    this._api.onChatEvent((evt) => this.handleChatEvent(evt));
    this._api.onState((st) => this.applyState(st));
    this._wireDrag();
    this._wireKeys();
    this._wireComposer();
    this._transcript.clear();
    this._api.ready();
    return this._api.getState().then((st) => this.applyState(st)).catch(() => {});
  }

  async submit(text) {
    const t = String(text || '').trim();
    if (!t) return;
    if (!this._state || !this._state.hasModel) { this._paint(); return; }
    if (this._streaming) await this._interruptTurn();
    this._beginTurn(t);
    const res = await this._sendTurn(t);
    if (res && res.success === false) this.finishTurn({ error: res.error || 'Request failed' });
  }

  finishTurn({ error, aborted } = {}) {
    if (!this._streaming) return;
    this._setStreaming(false);
    if (this._reply) {
      this._reply.finish({ error, aborted });
      this._notifyVoiceTurnEnd(error);
    }
    this._reply = null;
    this._transcript.scrollBottom();
    this._paint();
  }

  handleChatEvent(evt) {
    if (!evt || evt.requestId !== this._reqId) return;
    const p = evt.payload || {};
    switch (evt.type) {
      case 'delta': return this._onDelta(p.text);
      case 'rollback': return this._onRollback(p.chars);
      case 'tool': return this._onTool(p);
      case 'done': return this.finishTurn({ aborted: !!p.aborted });
      case 'error': return this.finishTurn({ error: p.message || 'Something went wrong' });
      default: return undefined;
    }
  }

  applyState(st) {
    const prev = this._state;
    this._state = st || {};
    const tabChanged = this._trackTab(st);
    this._paintHeader(st);
    const expanded = this._paintExpansion(st);
    if (tabChanged) this._resetForNewTab();
    const wasExpanded = !!(prev && prev.expanded);
    if (expanded && (!wasExpanded || tabChanged)) this._onOpened(st);
    if (!expanded && wasExpanded && this._voice && this._voice.isOn()) this._voice.stop();
    this._paint();
  }

  async loadHistory() {
    let rows = [];
    try { rows = await this._api.history(); } catch (_) { rows = []; }
    this._abandonReply();
    this._transcript.restore(rows);
  }

  _createVoice() {
    this._voice = OnDemandVoice.create({ api: this._api, win: this._win, hooks: this._voiceHooks() });
    if (this._voice) this._voice.setSpeak(this._prefs.speak);
  }

  _voiceHooks() {
    return {
      onState: () => this._paint(),
      onPartial: (text) => this._transcript.showPartial(text),
      onUtterance: (text) => this.submit(text),
      onSetupNeeded: () => { this._state = { ...(this._state || {}), stt: false }; this._paint(); },
      onMicError: (err) => this._status.setHint('Microphone unavailable: ' + (err && err.message ? err.message : 'permission denied'), true),
      onBargeIn: () => { if (this._streaming) this._api.abort().catch(() => {}); },
    };
  }

  _view() {
    return {
      state: this._state,
      voiceState: this._voice ? this._voice.state : 'off',
      hasVoice: !!this._voice,
      streaming: this._streaming,
      speak: this._prefs.speak,
    };
  }

  _paint() {
    const view = this._view();
    this._status.paintVoice(view);
    this._status.paintHint(view);
  }

  async _interruptTurn() {
    try { await this._api.abort(); } catch (_) {}
    for (let i = 0; i < OnDemandPanel.ABORT_WAIT_TRIES && this._streaming; i++) {
      await new Promise((r) => setTimeout(r, OnDemandPanel.ABORT_WAIT_MS));
    }
    this._streaming = false;
  }

  _beginTurn(text) {
    this._transcript.addUser(text);
    const bubble = this._transcript.addAssistant('', '');
    this._reply = new ReplyStream(bubble, {
      onScroll: () => this._transcript.scrollBottom(),
      requestFrame: (fn) => this._win.requestAnimationFrame(fn),
    });
    this._reqId = 'od-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
    this._setStreaming(true);
    if (this._voice && this._voice.isOn()) this._voice.setWaiting();
    this._paint();
  }

  async _sendTurn(text) {
    const spoken = !!(this._prefs.speak && this._state.tts && this._voice && this._voice.isOn());
    try {
      return await this._api.send({ requestId: this._reqId, text, spoken });
    } catch (err) {
      return { success: false, error: err && err.message ? err.message : String(err) };
    }
  }

  _setStreaming(on) {
    this._streaming = on;
    this._el.send.classList.toggle('stop', on);
    this._el.send.title = on ? 'Stop' : 'Send';
  }

  _notifyVoiceTurnEnd(error) {
    if (!this._voice) return;
    if (error) this._voice.onTurnError();
    else this._voice.onTurnDone();
  }

  _onDelta(text) {
    if (!text) return;
    if (this._reply) this._reply.append(text);
    if (this._voice) this._voice.onDelta(text);
  }

  _onRollback(chars) {
    if (chars > 0 && this._reply) this._reply.rollback(chars);
  }

  _onTool(p) {
    if (!this._reply || !p.tool) return;
    if (p.phase === 'run') this._reply.addStep(p.tool, p.params);
    else if (p.phase === 'done') this._reply.finishStep(p.tool, p.success);
  }

  _trackTab(st) {
    const tabId = st && st.tab ? st.tab.id : null;
    const convId = (st && st.conversationId) || null;
    const tabChanged = tabId !== this._tabId && !(convId && convId === this._convId);
    this._tabId = tabId;
    this._convId = convId || (tabChanged ? null : this._convId);
    return tabChanged;
  }

  _paintHeader(st) {
    const tab = st && st.tab;
    this._el.pageTitle.textContent = (tab && (tab.title || OnDemandPanel._hostOf(tab.url))) || 'This page';
    this._el.pageTitle.title = (tab && tab.url) || '';
    this._el.model.textContent = st && st.model ? st.model : (st && st.hasModel ? '' : 'No model set up');
    this._el.tileDot.className = 'od-tile-dot ' + (st && st.hasModel ? 'ready' : 'bad');
    this._doc.body.classList.toggle('tile-live', !!(st && st.hasModel && st.stt));
  }

  _paintExpansion(st) {
    const expanded = !!(st && st.expanded);
    this._doc.body.classList.toggle('expanded', expanded);
    this._doc.body.classList.toggle('collapsed', !expanded);
    this._el.panel.hidden = !expanded;
    return expanded;
  }

  _resetForNewTab() {
    if (this._streaming) {
      this._reqId = null;
      this._streaming = false;
      this._el.send.classList.remove('stop');
    }
    this._abandonReply();
    this._transcript.clear();
  }

  _abandonReply() {
    if (this._reply) this._reply.abandon();
    this._reply = null;
  }

  _onOpened(st) {
    this.loadHistory();
    this._el.txt.focus();
    if (this._prefs.autoVoice && st.stt && st.hasModel && this._voice && !this._voice.isOn()) this._voice.start();
  }

  static _hostOf(url) {
    try { return new URL(url).host; } catch (_) { return ''; }
  }

  _wireDrag() {
    const handlers = { onDrag: (dx, dy) => this._api.drag(dx, dy), onDragEnd: () => this._api.dragEnd() };
    new PointerDrag(this._el.tile, { ...handlers, onClick: () => this._api.setExpanded(true) }, this._win).attach();
    new PointerDrag(this._el.head, { ...handlers, onClick: null }, this._win).attach();
  }

  _wireKeys() {
    this._el.close.addEventListener('click', () => this._api.setExpanded(false));
    this._doc.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { e.preventDefault(); this._api.setExpanded(false); }
    });
  }

  _wireComposer() {
    this._el.send.addEventListener('click', () => this._onSendClick());
    this._el.txt.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this._submitTyped(); }
    });
    this._el.mic.addEventListener('click', () => this._toggleMic());
    this._el.speak.addEventListener('click', () => this._toggleSpeak());
    this._el.log.addEventListener('click', (e) => {
      const ex = e.target.closest && e.target.closest('.od-ex');
      if (ex) this.submit(ex.dataset.ex);
    });
  }

  _onSendClick() {
    if (this._streaming) { this._api.abort().catch(() => {}); return; }
    this._submitTyped();
  }

  _submitTyped() {
    const t = this._el.txt.value;
    this._el.txt.value = '';
    this.submit(t);
  }

  _toggleMic() {
    if (!this._voice || !(this._state && this._state.stt)) { this._paint(); return; }
    if (this._voice.isOn()) {
      this._voice.stop();
      this._prefs.setAutoVoice(false);
    } else {
      this._prefs.setAutoVoice(true);
      this._voice.start();
    }
    this._paint();
  }

  _toggleSpeak() {
    this._prefs.setSpeak(!this._prefs.speak);
    if (this._voice) this._voice.setSpeak(this._prefs.speak);
    this._status.paintVoice(this._view());
  }
}

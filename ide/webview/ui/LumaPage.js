import PageIcons from './PageIcons.js';
import PageState from './PageState.js';
import PageTheme from './PageTheme.js';
import HostLink from './HostLink.js';
import Transcript from './Transcript.js';
import AnswerStream from './AnswerStream.js';
import AssistantBlock from './AssistantBlock.js';
import ReasoningBlock from './ReasoningBlock.js';
import ToolBlock from './ToolBlock.js';
import ContextChips from './ContextChips.js';
import Composer from './Composer.js';
import ApprovalBar from './ApprovalBar.js';
import HeroCard from './HeroCard.js';
import PageChrome from './PageChrome.js';
import FrameRouter from './FrameRouter.js';

export default class LumaPage {
  static ELEMENT_IDS = ['brand', 'whoAgent', 'whoMeta', 'conn', 'scroller', 'hero', 'transcript', 'live',
    'chips', 'approval', 'input', 'ghost', 'sendBtn', 'stopBtn', 'hint'];

  constructor(grammar, win = window) {
    this.grammar = grammar;
    this._win = win;
    this.el = LumaPage._collectElements();
    this.state = new PageState();
    this.host = new HostLink(win);
    this._buildParts();
  }

  start() {
    this._paintIcons();
    this.composer.grow();
    this.chrome.paint();
    this.chips.paint(this.state.context);
    this._win.__luma = { dispatch: (msg) => this.dispatch(msg) };
    this._win.addEventListener('keydown', (e) => this._onWindowKeydown(e));
    this.host.send('ready', {});
  }

  dispatch(msg) {
    if (!msg || typeof msg !== 'object') return;
    switch (msg.kind) {
      case 'frame': this.router.route(msg.type, msg.payload); break;
      case 'state': this._applyState(msg.state); break;
      case 'theme': PageTheme.apply(document.documentElement, msg.vars); break;
      case 'reset': this._reset(); break;
      case 'focus': this.composer.focus(); break;
      case 'insertText': this.composer.insertText(msg.text || ''); break;
      case 'send': if (msg.text) { this.composer.value = msg.text; this.submit(); } break;
      case 'note': this.transcript.note(msg.text || '', msg.level || ''); break;
      case 'abort': this.abort(); break;
      default: break;
    }
  }

  submit() {
    const text = this.composer.value.trim();
    if (!text) return;
    if (this.state.status !== 'ready') { this.composer.flashHint('LumaBrowser is not connected.'); return; }
    this.composer.commit(text);
    const context = this.state.context.slice();
    if (this.state.streaming) {
      this.host.send('followup', { text });
      this.transcript.note('queued: ' + this.grammar.short(text, 80));
      return;
    }
    this.beginTurn(text, context);
    this.host.send('prompt', { text, context });
    this.state.context = [];
    this.chips.paint(this.state.context);
  }

  abort() {
    if (!this.state.streaming) return;
    this.host.send('abort', {});
    this.state.turn.stopping = true;
    this.transcript.setStatus('stopping');
    this.chrome.paint();
  }

  beginTurn(text, context) {
    this._resetTurn();
    this.state.streaming = true;
    this.composer.setSuggestion('');
    this.hero.hide();
    this.transcript.user(text, context);
    this.transcript.setStatus('working');
    this.chrome.paint();
  }

  endTurn() {
    this.state.streaming = false;
    this.state.turn.stopping = false;
    this.transcript.setStatus(null);
    this.approval.hide();
    this.chrome.paint();
    this.host.send('turnEnded', {});
  }

  newToolBlock(tool, params) {
    return new ToolBlock({ transcript: this.transcript, host: this.host, grammar: this.grammar, tool, params });
  }

  static _collectElements() {
    const el = {};
    for (const id of LumaPage.ELEMENT_IDS) el[id] = document.getElementById(id);
    return el;
  }

  _buildParts() {
    this.transcript = new Transcript(this.el, this.grammar);
    this.answers = new AnswerStream({
      newAnswer: () => new AssistantBlock(this.transcript, this.host),
      newReasoning: () => new ReasoningBlock(this.transcript, this.state.showReasoning),
    });
    this.chips = new ContextChips(this.el.chips, this.host);
    this.composer = new Composer(this.el, this);
    this.approval = new ApprovalBar(this.el.approval, this);
    this.hero = new HeroCard(this.el.hero, this);
    this.chrome = new PageChrome(this.el, this);
    this.router = new FrameRouter(this);
  }

  _paintIcons() {
    this.el.brand.innerHTML = PageIcons.ICONS.logo;
    this.el.sendBtn.innerHTML = PageIcons.ICONS.send;
    this.el.stopBtn.innerHTML = PageIcons.ICONS.stop;
  }

  _resetTurn() {
    this.answers.reset();
    const turn = this.state.turn;
    turn.tool = null;
    turn.pendingTool = null;
    turn.startedAt = Date.now();
    turn.stopping = false;
  }

  _applyState(patch) {
    const wasReady = this.state.status === 'ready';
    Object.assign(this.state, patch || {});
    if (patch && Array.isArray(patch.context)) this.chips.paint(this.state.context);
    if (this.state.status === 'ready' && !wasReady) this.composer.focus();
    if (patch && patch.streaming === false && this.state.streaming === false && this.transcript.status) this.transcript.setStatus(null);
    this.chrome.paint();
  }

  _reset() {
    this.transcript.clear();
    this.approval.hide();
    this.composer.setSuggestion('');
    this.state.streaming = false;
    this.chrome.paint();
  }

  _onWindowKeydown(e) {
    if (e.key === 'Escape' && this.state.streaming && !this.approval.isOpen()) {
      e.preventDefault();
      this.abort();
    }
  }
}

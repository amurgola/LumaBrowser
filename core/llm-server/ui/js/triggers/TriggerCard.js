import TriggerCardData from './TriggerCardData.js';
import TriggerCardHtml from './TriggerCardHtml.js';
import TriggerCardActions from './TriggerCardActions.js';

export default class TriggerCard {
  static NOTE_MS = 6000;
  static PLACEHOLDER = 'Describe what the trigger should do…';
  static LEAVE_RESET = {
    ctx: null, bar: null, trigger: null, composerOpen: false, secretOpen: false, secret: null, pending: null,
    versions: null, agent: null, note: null, running: false,
  };

  constructor({ chatMode = null } = {}) {
    this.state = TriggerCard._freshState();
    this.element = null;
    this._subscribed = false;
    this._actions = new TriggerCardActions(this, { openRuns: (id) => this._openRuns(id) });
    this._chatMode = chatMode;
  }

  setChatMode(chatMode) {
    this._chatMode = chatMode;
  }

  decorate(els, ctx) {
    if (!ctx || !ctx.api || !ctx.api.triggers) return;
    this.state.api = ctx.api;
    this.state.ctx = ctx;
    this.state.bar = els && els.bar;
    this._subscribe(ctx.api);
    if (els && els.textarea) els.textarea.placeholder = TriggerCard.PLACEHOLDER;
    this.refresh().catch(() => {});
  }

  leave() {
    this.unmount();
    Object.assign(this.state, TriggerCard.LEAVE_RESET, { deliveries: [] });
  }

  async refresh() {
    if (!this.state.ctx) return;
    const loaded = await TriggerCardData.load(this.state.api, this.state.ctx.conversationId);
    this.state.trigger = loaded ? loaded.trigger : null;
    if (loaded && loaded.details) Object.assign(this.state, loaded.details);
    this.paint();
  }

  paint() {
    const { bar, ctx, trigger } = this.state;
    if (!bar || !ctx) return;
    if (!trigger) { this.unmount(); return; }
    if (!this.element) this._createElement();
    this.element.dataset.status = this.state.running ? 'running' : trigger.status;
    this.element.innerHTML = TriggerCardHtml.build(trigger, this.state);
    this._place(bar);
  }

  unmount() {
    if (this.element && this.element.parentNode) this.element.parentNode.removeChild(this.element);
    this.element = null;
  }

  setNote(text, cls) {
    this.state.note = text ? { text, cls } : null;
    if (!this.state.note) return;
    setTimeout(() => {
      if (this.state.note && this.state.note.text === text) { this.state.note = null; this.paint(); }
    }, TriggerCard.NOTE_MS);
  }

  _createElement() {
    this.element = document.createElement('div');
    this.element.className = 'cm-trig-card';
    this.element.addEventListener('click', (e) => this._actions.handle(e));
  }

  _place(bar) {
    const composer = bar.querySelector('.cm-composer');
    const host = composer ? composer.parentNode : bar;
    if (this.element.parentNode === host) return;
    if (composer) host.insertBefore(this.element, composer);
    else host.appendChild(this.element);
  }

  _subscribe(api) {
    if (this._subscribed || typeof api.onTriggersEvent !== 'function') return;
    this._subscribed = true;
    api.onTriggersEvent((ev) => this._onTriggersEvent(ev));
  }

  _onTriggersEvent(ev) {
    if (!this.state.ctx) return;
    const payload = (ev && ev.payload) || {};
    const trigger = this.state.trigger;
    if (trigger && payload.triggerId && payload.triggerId !== trigger.id) return;
    if (trigger && ev.type === 'run-started') { this.state.running = true; this.paint(); return; }
    if (ev.type === 'run-finished') this.state.running = false;
    this.refresh().catch(() => {});
  }

  _openRuns(id) {
    const chat = this._chatMode;
    if (chat && typeof chat.openTrigger === 'function') chat.openTrigger(id);
  }

  static _freshState() {
    return {
      api: null, ctx: null, bar: null, trigger: null, baseUrls: null, watch: null, secret: null, pending: null,
      versions: null, agent: null, deliveries: [], running: false, busy: false, composerOpen: false, composeText: null,
      secretOpen: false, note: null, agentChoices: [], tabChoices: [],
    };
  }
}

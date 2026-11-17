import ConversationJobsHtml from './ConversationJobsHtml.js';

export default class ConversationJobsStrip {
  constructor(ctx) {
    this._ctx = ctx;
    this._jobs = [];
    this._stopping = new Set();
    this._element = null;
    this._bar = null;
  }

  reset() {
    this._jobs = [];
    this._stopping.clear();
    this._unmount();
  }

  attach(bar) {
    this._bar = bar;
    this._paint();
  }

  async refresh() {
    const { api, state } = this._ctx;
    const conversationId = state.activeId;
    const jobs = await ConversationJobsStrip._list(api, conversationId);
    if (state.activeId !== conversationId) return;
    this._jobs = jobs;
    this._paint();
  }

  onEvent(ev) {
    const payload = (ev && ev.payload) || {};
    if (!payload.conversationId || payload.conversationId !== this._ctx.state.activeId) return;
    if (ev.type === 'posted') { this._ctx.conversation.showPosted().catch(() => {}); return; }
    if (!payload.job) return;
    this._jobs = this._jobs.filter((job) => job.id !== payload.job.id);
    if (ev.type === 'changed') this._jobs.push(payload.job);
    else this._stopping.delete(payload.job.id);
    this._paint();
  }

  _paint() {
    if (!this._bar) return;
    if (!this._jobs.length) { this._unmount(); return; }
    if (!this._element) this._createElement();
    this._element.innerHTML = ConversationJobsHtml.build(this._jobs, this._stopping);
    this._place();
  }

  _createElement() {
    this._element = document.createElement('div');
    this._element.className = 'cm-job-strip';
    this._element.addEventListener('click', (e) => this._onClick(e));
  }

  _place() {
    const composer = this._bar.querySelector('.cm-composer');
    const host = composer ? composer.parentNode : this._bar;
    if (this._element.parentNode === host) return;
    if (composer) host.insertBefore(this._element, composer);
    else host.appendChild(this._element);
  }

  _unmount() {
    if (this._element && this._element.parentNode) this._element.parentNode.removeChild(this._element);
    this._element = null;
  }

  _onClick(e) {
    const button = e.target && e.target.closest ? e.target.closest('[data-job-cancel]') : null;
    const { api } = this._ctx;
    if (!button || !api.convJobs || typeof api.convJobs.cancel !== 'function') return;
    const id = button.getAttribute('data-job-cancel');
    this._stopping.add(id);
    this._paint();
    Promise.resolve(api.convJobs.cancel(id)).catch(() => {});
  }

  static async _list(api, conversationId) {
    if (!conversationId || !api.convJobs || typeof api.convJobs.list !== 'function') return [];
    try {
      const reply = await api.convJobs.list(conversationId);
      return (reply && Array.isArray(reply.jobs)) ? reply.jobs : [];
    } catch (_) {
      return [];
    }
  }
}

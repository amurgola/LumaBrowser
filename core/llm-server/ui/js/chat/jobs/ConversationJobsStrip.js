import ConversationJobsHtml from './ConversationJobsHtml.js';
import ComposerStrip from '../composer/ComposerStrip.js';

export default class ConversationJobsStrip extends ComposerStrip {
  static ORDER = 10;

  constructor(ctx) {
    super(ctx, 'cm-job-strip', ConversationJobsStrip.ORDER);
    this._jobs = [];
    this._stopping = new Set();
    this._collapsed = false;
  }

  reset() {
    this._jobs = [];
    this._stopping.clear();
    this.unmount();
  }

  async refresh() {
    const { api, state } = this._ctx;
    const conversationId = state.activeId;
    const jobs = await ConversationJobsStrip._list(api, conversationId);
    if (state.activeId !== conversationId) return;
    this._jobs = jobs;
    this.paint();
  }

  onEvent(ev) {
    const payload = (ev && ev.payload) || {};
    if (!payload.conversationId || payload.conversationId !== this._ctx.state.activeId) return;
    if (ev.type === 'posted') { this._ctx.conversation.showPosted().catch(() => {}); return; }
    if (!payload.job) return;
    this._jobs = this._jobs.filter((job) => job.id !== payload.job.id);
    if (ev.type === 'changed') this._jobs.push(payload.job);
    else this._stopping.delete(payload.job.id);
    this.paint();
  }

  html() {
    return this._jobs.length ? ConversationJobsHtml.build(this._jobs, this._stopping, { collapsed: this._collapsed }) : '';
  }

  onClick(event) {
    if (ComposerStrip.target(event, 'data-jobs-toggle')) {
      this._collapsed = !this._collapsed;
      this.paint();
      return;
    }
    const button = ComposerStrip.target(event, 'data-job-cancel');
    const { api } = this._ctx;
    if (!button || !api.convJobs || typeof api.convJobs.cancel !== 'function') return;
    const id = button.getAttribute('data-job-cancel');
    this._stopping.add(id);
    this.paint();
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

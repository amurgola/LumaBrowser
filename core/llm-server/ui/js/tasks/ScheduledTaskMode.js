import ScheduledTaskForm from './ScheduledTaskForm.js';

export default class ScheduledTaskMode {
  static ID = 'scheduled-task';

  static INTRO = [
    'I can run a task for you automatically on a schedule, using the tools you allow, and keep a history of every run right here.',
    '',
    'Setting one up takes three things:',
    '',
    '1. **Pick the model and tools for the runs.** Use this chat\'s model picker and gear panel. Whatever is selected here is exactly what each scheduled run will use.',
    '2. **Tell me what the task should do.** Be specific: what to look up or do, where results should go (a webhook URL, for example), and what the report should include.',
    '3. **Tell me how often to run it.** Anywhere from every 5 minutes to every 7 days.',
    '',
    'I will ask a clarifying question or two if something is ambiguous, then summarize the plan for your confirmation. Once you confirm, I create the task and run a test immediately so you can see a real result.',
    '',
    'Afterwards the task appears in the sidebar under **Scheduled**, where you can view its runs, pause it, or delete it. To change it later, just reopen this chat and tell me what to adjust.',
    '',
    'So: what should this task do?',
  ].join('\n');

  constructor(chatExt) {
    this._chatExt = chatExt;
  }

  register() {
    if (!this._chatExt || !this._chatExt.registerMode) return;
    this._chatExt.registerMode(this.hooks());
  }

  hooks() {
    return {
      id: ScheduledTaskMode.ID,
      openSetup: (api, ctx) => this._openSetup(api, ctx),
      startConversation: (api, ctx, data) => this._startConversation(api, ctx, data),
    };
  }

  async _openSetup(api, ctx) {
    const host = ctx && typeof ctx.setupHost === 'function' ? ctx.setupHost() : null;
    const opts = { api, host, initial: { ...ScheduledTaskForm.INITIAL } };
    return host && this._chatExt.openSchemaInline
      ? this._chatExt.openSchemaInline(ScheduledTaskForm.SCHEMA, opts)
      : this._chatExt.openSchemaModal(ScheduledTaskForm.SCHEMA, opts);
  }

  async _startConversation(api, ctx, data) {
    if (data && String(data.prompt || '').trim()) {
      ctx.sendTurn(ScheduledTaskForm.openingTurn(data));
      return;
    }
    try {
      await api.conv.addMessage({ conversationId: ctx.conversationId, role: 'assistant', content: ScheduledTaskMode.INTRO });
    } catch (_) {}
    try { ctx.refresh(); } catch (_) {}
  }
}

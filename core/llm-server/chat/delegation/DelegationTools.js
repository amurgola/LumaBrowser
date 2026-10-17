const McpResult = require('../../../shell/McpResult');
const ChatModelRef = require('../router/ChatModelRef');
const DelegateTargets = require('./DelegateTargets');
const SubConversationRun = require('./SubConversationRun');

class DelegationTools {
  static SOURCE = 'core.delegation';
  static MAX_TITLE_CHARS = 60;

  static TOOLS = [
    {
      name: 'list_delegates',
      description: 'List what this chat can hand a task to: specialised chat modes (for example building and '
        + 'installing a LumaBrowser extension, building a game) and the user\'s custom agents, each with the '
        + 'arguments it takes, plus the sub-conversations this chat already started. Call it before delegate_task.',
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'delegate_task',
      description: 'Hand a task to a specialised chat mode or custom agent (see list_delegates). It runs in its own '
        + 'sub-conversation, nested under this chat in the sidebar, with the tools you do not have here (for '
        + 'example writing and installing LumaBrowser extension files), and you get its reply. Start one with '
        + '{ target, task } (plus any argument the target lists); continue one, to answer its question or ask for '
        + 'changes, with { conversationId, message }. Use it whenever the user asks for something a delegate does, '
        + 'instead of only describing how they could do it themselves.',
      inputSchema: {
        type: 'object',
        properties: {
          target: { type: 'string', description: 'A target id from list_delegates, to start a new sub-conversation.' },
          task: { type: 'string', description: 'The complete brief for a new sub-conversation, with every detail the user gave.' },
          name: { type: 'string', description: 'Optional name for what gets built.' },
          projectPath: { type: 'string', description: 'A folder on disk, for targets that work on a project.' },
          conversationId: { type: 'string', description: 'A sub-conversation this chat started, to continue it.' },
          message: { type: 'string', description: 'The next message for that sub-conversation.' },
        },
      },
    },
  ];

  static NOTE = 'This ran in a sub-conversation the user can open from the sidebar, nested under this chat. Tell '
    + 'the user what it did. If it asked a question or needs a decision, ask the user (or answer from what they '
    + 'already told you) and reply with delegate_task({ conversationId, message }).';

  constructor({ getRouter, registry }) {
    this._getRouter = getRouter;
    this._targets = new DelegateTargets({ registry });
  }

  handler() {
    return (name, args, opts) => this.handle(name, args, opts);
  }

  async handle(name, args = {}, opts = {}) {
    const chat = opts && opts.chat;
    const router = this._getRouter();
    if (!chat || !chat.conversationId) return McpResult.error(`${name} only works inside the LumaBrowser chat.`);
    if (!router || !router.chatStore) return McpResult.error('The chat is not ready yet.');
    if (name === 'list_delegates') return McpResult.text(this._list(router.chatStore, chat.conversationId));
    if (name === 'delegate_task') return this._delegate(router, args || {}, opts);
    return McpResult.error(`Unknown delegation tool: ${name}`);
  }

  _list(store, parentId) {
    const targets = this._targets.list().map((t) => ({ target: t.id, label: t.label, description: t.description, params: t.params }));
    const subConversations = store.listSubConversations(parentId).map((c) => ({ conversationId: c.id, title: c.title, mode: c.mode }));
    return { success: true, targets, subConversations };
  }

  async _delegate(router, args, opts) {
    const store = router.chatStore;
    const parentId = opts.chat.conversationId;
    const parent = store.getConversation(parentId);
    if (!parent) return McpResult.error('This chat was not found.');
    if (parent.parentConversationId) return McpResult.error('A delegated sub-conversation cannot delegate again; do the work here or report back.');
    if (args.conversationId) return this._continue(router, parent, args, opts);
    return this._start(router, parent, args, opts);
  }

  async _start(router, parent, args, opts) {
    const store = router.chatStore;
    if (!args.target) return McpResult.error('delegate_task needs "target" (from list_delegates) to start, or "conversationId" to continue.');
    const target = this._targets.find(args.target);
    if (!target) return McpResult.error(`No delegate "${args.target}". Available: ${this._targetIds()}.`);
    if (!args.task || !String(args.task).trim()) return McpResult.error('delegate_task needs "task": the complete brief.');
    const started = this._targets.start(target, args);
    if (started.error) return McpResult.error(started.error);
    const modelRef = DelegationTools._modelRef(router, parent);
    if (!modelRef) return McpResult.error('No chat model is available to run the sub-conversation.');
    const conv = store.createConversation({
      title: DelegationTools._title(started.title || args.name || args.task),
      modelRef,
      provider: ChatModelRef.providerTag(modelRef),
      toolsEnabled: true,
      mode: target.modeId,
      parentConversationId: parent.id,
    });
    store.setMeta(conv.id, { mode: target.modeId, data: { ...started.data, delegatedFrom: parent.id } });
    const run = await this._run(router, conv, target.label, modelRef, [{ role: 'user', content: started.message }], started.message, opts);
    return DelegationTools._answer(conv, target.id, run);
  }

  async _continue(router, parent, args, opts) {
    const store = router.chatStore;
    const conv = store.getConversation(String(args.conversationId));
    if (!conv || conv.parentConversationId !== parent.id) {
      return McpResult.error(`"${args.conversationId}" is not a sub-conversation of this chat. Call list_delegates to see them.`);
    }
    const message = String(args.message || args.task || '').trim();
    if (!message) return McpResult.error('delegate_task needs "message" to continue a sub-conversation.');
    const modelRef = conv.modelRef || DelegationTools._modelRef(router, parent);
    const history = DelegationTools._history(store, conv.id);
    const run = await this._run(router, conv, this._labelOf(conv), modelRef, [...history, { role: 'user', content: message }], message, opts);
    return DelegationTools._answer(conv, null, run);
  }

  _run(router, conv, label, modelRef, messages, userMessage, opts) {
    const card = { invocationId: DelegationTools._invocationId(), label: `${DelegationTools._kind(label)}: ${conv.title}`, conversationId: conv.id };
    const sub = new SubConversationRun({ router, emit: opts.emit, isAborted: opts.chat.isAborted, card });
    const runApprovals = DelegationTools._runApprovals(router.chatStore, conv.id);
    return sub.run({ conversationId: conv.id, modelRef, messages, userMessage, runApprovals });
  }

  static _runApprovals(store, conversationId) {
    const granted = DelegationTools._granted(store, conversationId);
    return {
      granted,
      onGranted: (name) => {
        try {
          const data = store.getMeta(conversationId).data || {};
          const current = Array.isArray(data.approvedTools) ? data.approvedTools : [];
          if (current.includes(name)) return;
          store.setMeta(conversationId, { data: { ...data, approvedTools: [...current, String(name)] } });
        } catch (_) {}
      },
    };
  }

  static _granted(store, conversationId) {
    try {
      const data = store.getMeta(conversationId).data || {};
      return Array.isArray(data.approvedTools) ? data.approvedTools.map(String) : [];
    } catch (_) {
      return [];
    }
  }

  _labelOf(conv) {
    const t = this._targets.list().find((x) => x.modeId === conv.mode);
    return (t && t.label) || conv.mode;
  }

  _targetIds() {
    const ids = this._targets.list().map((t) => t.id);
    return ids.length ? ids.join(', ') : 'none (no delegating mode is installed)';
  }

  static _modelRef(router, parent) {
    if (parent && parent.modelRef) return parent.modelRef;
    try { return (router.listModels && router.listModels().defaultRef) || null; } catch (_) { return null; }
  }

  static _history(store, conversationId) {
    try {
      return store.listActiveMessages(conversationId)
        .filter((m) => m && (m.content || m.role === 'user'))
        .map((m) => ({ role: m.role, content: m.content || '' }));
    } catch (_) {
      return [];
    }
  }

  static _answer(conv, target, run) {
    const out = { success: run.status !== 'failed', conversationId: conv.id, title: conv.title, status: run.status, reply: run.reply };
    if (target) out.target = target;
    if (run.error) out.error = run.error;
    out.note = DelegationTools.NOTE;
    return McpResult.text(out);
  }

  static _kind(label) {
    const s = String(label || '');
    const i = s.indexOf(':');
    return (i > 0 ? s.slice(0, i) : s).trim() || 'Delegate';
  }

  static _title(text) {
    const s = String(text || '').replace(/\s+/g, ' ').trim();
    if (!s) return 'Delegated task';
    return s.length > DelegationTools.MAX_TITLE_CHARS ? s.slice(0, DelegationTools.MAX_TITLE_CHARS - 3).trimEnd() + '...' : s;
  }

  static _invocationId() {
    return 'dlg-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
  }
}

module.exports = DelegationTools;

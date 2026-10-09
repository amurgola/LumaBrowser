const CoreRequire = require('../../CoreRequire');
const ProjectTools = require('../project/ProjectTools');
const ReadBudget = require('../project/ReadBudget');
const SubAgentTextSink = require('./SubAgentTextSink');

const ExtensionGlobals = CoreRequire.require('shell/extensions/ExtensionGlobals');

class SubAgentRunner {
  static EXPLORE_TOOLS = ['project_overview', 'read_file', 'grep', 'find', 'list_dir'];
  static PARENT_ONLY_TOOLS = ['run_command', 'check_process'];
  static EXPLORE_PROMPT = 'You are a focused exploration sub-agent. Investigate using read_file / grep / find / '
    + 'list_dir and then report concise, concrete findings (files, line numbers, what you concluded). Do NOT edit anything.';
  static EDIT_PROMPT = 'You are a focused edit sub-agent. Read the relevant files first, then make the requested change '
    + 'with edit_file / write_file. Keep the change minimal and matching the surrounding style. Report exactly what you changed.';
  static BUDGET = { maxIterations: 24, noTimeout: true };

  constructor({ context, meta, modelRef = null, getRouter = () => ExtensionGlobals.chatRouter(), Bridge = null }) {
    this._context = context;
    this._meta = meta;
    this._modelRef = modelRef;
    this._getRouter = getRouter;
    this._Bridge = Bridge;
  }

  async run(task, opts = {}) {
    const router = this._getRouter();
    if (!router || typeof router.getAgentDeps !== 'function') return SubAgentRunner._failure('chat router unavailable');
    const modelRef = this._modelRef || SubAgentRunner._defaultModel(router);
    if (!modelRef) return SubAgentRunner._failure('no model configured');
    const isAborted = typeof opts.isAborted === 'function' ? opts.isAborted : () => false;
    if (isAborted()) return SubAgentRunner._failure('stopped before starting');
    return this._runOn(router, modelRef, task, isAborted);
  }

  asFunction() {
    return (task, opts) => this.run(task, opts);
  }

  async _runOn(router, modelRef, task, isAborted) {
    const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const conversationId = `codebatch:${stamp}`;
    const sessions = new Map();
    const tools = this._toolsFor(task, conversationId, sessions);
    const sink = new SubAgentTextSink();
    let handle;
    try {
      handle = this._bridgeFor(router).run(this._runOptions({ router, modelRef, task, tools, sink, isAborted, conversationId, stamp }));
    } catch (e) {
      return SubAgentRunner._failure((e && e.message) || 'sub-agent failed to start');
    }
    try { await handle.done; } catch (e) { sink.setError((e && e.message) || 'sub-agent failed'); }
    const s = sessions.get(conversationId);
    return { text: sink.text(), error: sink.error(), changedFiles: s ? [...s.files.keys()] : [] };
  }

  _runOptions({ router, modelRef, task, tools, sink, isAborted, conversationId, stamp }) {
    return {
      modelRef,
      messages: [{ role: 'user', content: task.instruction }],
      temperature: 0.2,
      conversationId,
      assistantMessageId: `codebatchmsg:${stamp}`,
      deps: router.getAgentDeps() || {},
      hooks: sink.hooks,
      priorMessages: [],
      modeSystemPrompt: task.kind === 'edit' ? SubAgentRunner.EDIT_PROMPT : SubAgentRunner.EXPLORE_PROMPT,
      images: [],
      extraTools: tools,
      allowedTools: tools.map((t) => t.name).concat('validate_code'),
      noBrowser: true,
      agentBudget: SubAgentRunner.BUDGET,
      shouldAbort: isAborted,
    };
  }

  _toolsFor(task, conversationId, sessions) {
    const { truncator, wholeFileMaxBytes, ctxPerSlot } = ReadBudget.compute();
    const all = ProjectTools.create({
      context: this._context, conversationId, meta: this._meta, sessions, truncator, wholeFileMaxBytes, ctxPerSlot,
    });
    if (task.kind === 'edit') return all.filter((t) => !SubAgentRunner.PARENT_ONLY_TOOLS.includes(t.name));
    return all.filter((t) => SubAgentRunner.EXPLORE_TOOLS.includes(t.name));
  }

  _bridgeFor(router) {
    const Bridge = this._Bridge || CoreRequire.require('llm-server/chat/AgentChatBridge');
    return new Bridge({ router });
  }

  static _defaultModel(router) {
    try { return router.listModels().defaultRef || null; } catch (_) { return null; }
  }

  static _failure(error) {
    return { text: '', error, changedFiles: [] };
  }
}

module.exports = SubAgentRunner;

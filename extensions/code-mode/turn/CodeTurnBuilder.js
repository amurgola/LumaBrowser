const CoreRequire = require('../CoreRequire');
const SystemPromptBuilder = require('../prompts/SystemPromptBuilder');
const ProjectTools = require('../tools/project/ProjectTools');
const ReadBudget = require('../tools/project/ReadBudget');
const ExtensionBuildTools = require('../tools/build/ExtensionBuildTools');
const BatchDispatchTool = require('../tools/batch/BatchDispatchTool');
const SubAgentRunner = require('../tools/batch/SubAgentRunner');
const AgentOverlay = require('./AgentOverlay');
const ContextFilesBlock = require('./ContextFilesBlock');
const DecodeSlots = require('./DecodeSlots');

const BatchScheduler = CoreRequire.require('llm-server/chat/BatchScheduler');

class CodeTurnBuilder {
  static TEMPERATURE = 0.2;
  static AGENT_BUDGET = { maxIterations: 40, noTimeout: true, reasoningCharsPerStep: 1e9, reasoningCharsTotal: 1e9 };

  constructor({ context, sessions }) {
    this._context = context;
    this._sessions = sessions;
  }

  build({ meta, conversationId, modelRef = null }) {
    const data = (meta && meta.data) || {};
    const plan = this._planTools(data, meta, conversationId, modelRef);
    const overlay = plan.mode === 'project' ? AgentOverlay.resolve(data) : null;
    const allowedTools = AgentOverlay.mergeAllowedTools(plan.tools ? [...plan.tools.map((t) => t.name), 'validate_code'] : null, overlay);
    return {
      systemPrompt: this._systemPrompt(data, plan, overlay, conversationId),
      temperature: CodeTurnBuilder.TEMPERATURE,
      agent: !!plan.tools,
      tools: plan.tools,
      allowedTools,
      ...AgentOverlay.turnFields(overlay),
      noBrowser: true,
      agentBudget: plan.tools ? { ...CodeTurnBuilder.AGENT_BUDGET } : null,
    };
  }

  _planTools(data, meta, conversationId, modelRef) {
    const hasCode = !!(this._context && this._context.code);
    const projectPath = data.projectPath && String(data.projectPath).trim();
    const hasTask = !!(data.task && String(data.task).trim());
    if (hasCode && projectPath) return this._projectPlan(meta, conversationId, modelRef);
    if (hasCode && hasTask) {
      return { mode: 'build', tools: ExtensionBuildTools.create({ context: this._context, conversationId, meta, sessions: this._sessions }), batchConcurrency: 0 };
    }
    return { mode: 'chat', tools: null, batchConcurrency: 0 };
  }

  _projectPlan(meta, conversationId, modelRef) {
    this._resetWholeReads(conversationId);
    const { truncator, wholeFileMaxBytes, ctxPerSlot } = ReadBudget.compute();
    const tools = ProjectTools.create({ context: this._context, conversationId, meta, sessions: this._sessions, truncator, wholeFileMaxBytes, ctxPerSlot });
    const concurrency = DecodeSlots.count();
    if (concurrency <= 1) return { mode: 'project', tools, batchConcurrency: 0 };
    tools.push(this._batchTool(meta, modelRef, concurrency));
    return { mode: 'project', tools, batchConcurrency: concurrency };
  }

  _resetWholeReads(conversationId) {
    const existing = this._sessions.get(conversationId);
    if (existing && existing.readWhole) existing.readWhole.clear();
  }

  _batchTool(meta, modelRef, concurrency) {
    const runner = new SubAgentRunner({ context: this._context, meta, modelRef });
    return new BatchDispatchTool({ scheduler: new BatchScheduler(), concurrency, runSubAgent: runner.asFunction() }).toTool();
  }

  _systemPrompt(data, plan, overlay, conversationId) {
    return SystemPromptBuilder.build(data, {
      hasTools: !!plan.tools,
      hasCommand: !!(plan.tools && plan.tools.some((t) => t.name === 'run_command')),
      environment: this._environment(),
      mode: plan.mode,
      batchConcurrency: plan.batchConcurrency,
      persona: AgentOverlay.personaOf(overlay),
      contextFiles: plan.mode === 'project' ? ContextFilesBlock.render(this._context, this._sessions, conversationId, data) : null,
    });
  }

  _environment() {
    try {
      const code = this._context && this._context.code;
      return code && typeof code.capabilities === 'function' ? code.capabilities() : null;
    } catch (_) {
      return null;
    }
  }
}

module.exports = CodeTurnBuilder;

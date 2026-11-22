const ConversationPlan = require('./ConversationPlan');
const PlanProgressText = require('./PlanProgressText');
const PlanReminder = require('./PlanReminder');
const PlanSteps = require('./PlanSteps');

class PlanTool {
  static TOOL = 'update_plan';
  static EVENT = 'plan';

  static NOTE = [
    'Plans: when the user asks for something that takes three or more separate steps, or steps that depend on each',
    `other's results, call ${PlanTool.TOOL} before any other tool with plan: the steps in the order you will do them`,
    '(3 to 8 short steps, each a result you can finish). The user sees the plan and watches it move, so keep it',
    `true: each time you finish a step, call ${PlanTool.TOOL} with done: that step's number before you start the next`,
    'step. Your final answer completes the last step. Pass plan again only to change the steps, and say why in',
    'explanation. Do not plan a plain question, a single lookup or a one-step request: just do it.',
  ].join(' ');

  static DESCRIPTION = 'Keep the plan for a multi-step request; the user sees it. plan: every step in order, to '
    + 'write the plan or change it (an empty list clears it). done: the number of the step you just finished; it '
    + 'and the steps before it are marked completed and the next step is in progress.';

  static BAD_ARGS = 'update_plan needs "plan" (the list of steps, each { "step": "what it gets done" }) to write '
    + 'or change the plan, or "done" (the number of the step just finished) to move it on.';

  static NO_PLAN = 'There is no plan yet. Call update_plan with "plan": the list of steps.';

  static LIST_KEYS = ['plan', 'steps', 'todos', 'items'];
  static DONE_KEYS = ['done', 'completed', 'finished', 'complete'];

  static forTurn(store, turn) {
    const { convId = null, modeTurn = null, evalOverrides = null } = turn || {};
    if (!convId || evalOverrides) return null;
    if (modeTurn && modeTurn.planning !== true) return null;
    if (!store || typeof store.getMeta !== 'function' || typeof store.setMeta !== 'function') return null;
    return new PlanTool(new ConversationPlan(store, convId), convId);
  }

  constructor(plan, conversationId) {
    this._plan = plan;
    this._conversationId = conversationId;
    this._firstRequest = true;
    this._justAnswered = false;
  }

  get extraTool() {
    return {
      name: PlanTool.TOOL,
      description: PlanTool.DESCRIPTION,
      inputSchema: PlanTool._schema(),
      handler: (params, ctx) => this._update(params, ctx),
    };
  }

  get note() {
    return PlanTool.NOTE;
  }

  beginTurn(hooks) {
    try {
      if (this._plan.retireFinished()) PlanTool._tell(hooks && hooks.onAgentEvent, this._conversationId, null);
    } catch (_) {}
  }

  watching(hooks) {
    const onDone = hooks && hooks.onDone;
    return {
      ...hooks,
      onDone: (summary) => {
        this._finishLastStep(summary, hooks);
        return typeof onDone === 'function' ? onDone(summary) : undefined;
      },
    };
  }

  reminder() {
    const first = this._firstRequest;
    const repeated = this._justAnswered;
    this._firstRequest = false;
    this._justAnswered = false;
    if (repeated) return null;
    const plan = this._plan.read();
    return first ? PlanReminder.build(plan) : PlanReminder.status(plan);
  }

  beforeFinalAnswer() {
    const plan = this._plan.read();
    const steps = plan ? plan.steps : [];
    const open = steps.map((step, index) => ({ ...step, number: index + 1 }))
      .filter((step) => step.status !== PlanSteps.COMPLETED && step.number !== steps.length);
    if (!open.length) return null;
    this._justAnswered = true;
    const listed = open.map((step) => `${step.number}. ${step.text}`).join('; ');
    return `Before you answer: your plan still shows these steps unfinished: ${listed}. If that work is done, call ${PlanTool.TOOL} `
      + 'with done: the number of the last step you finished, then give your answer. If it is not done, do it now, or '
      + 'change the plan to what is true.';
  }

  _update(params, ctx) {
    const args = params && typeof params === 'object' ? params : {};
    const { steps, error } = this._stepsAfter(args);
    if (error) return { success: false, error };
    const plan = this._plan.save(steps, args.explanation);
    this._justAnswered = true;
    PlanTool._tell(ctx && ctx.emit, this._conversationId, plan);
    const next = PlanProgressText.nextCall(steps);
    return { success: true, summary: PlanProgressText.summary(steps), ...(next ? { next } : {}) };
  }

  _stepsAfter(args) {
    const listed = PlanTool._argument(args, PlanTool.LIST_KEYS);
    const finished = PlanTool._numbers(PlanTool._argument(args, PlanTool.DONE_KEYS));
    if (listed === undefined && !finished.length) return { error: PlanTool._badArgs(args) };
    const base = listed === undefined ? this._storedSteps() : PlanSteps.normalize(listed);
    if (!base) return { error: listed === undefined ? PlanTool.NO_PLAN : PlanTool._badArgs(args) };
    return PlanTool._marking(base, finished);
  }

  _storedSteps() {
    const plan = this._plan.read();
    return plan ? plan.steps : null;
  }

  _finishLastStep(summary, hooks) {
    if (summary && (summary.aborted || summary.stopReason)) return;
    try {
      const plan = this._plan.read();
      const progress = plan ? PlanSteps.progress(plan.steps) : null;
      if (!progress || progress.done || progress.currentIndex !== progress.total - 1) return;
      const finished = this._plan.save(PlanSteps.complete(plan.steps, progress.total), plan.explanation);
      PlanTool._tell(hooks && hooks.onAgentEvent, this._conversationId, finished);
    } catch (_) {}
  }

  static _marking(steps, finished) {
    let marked = steps;
    for (const number of finished) {
      marked = PlanSteps.complete(marked, number);
      if (!marked) return { error: `There is no step ${number}: the plan has ${steps.length} steps, numbered from 1.` };
    }
    return { steps: marked };
  }

  static _badArgs(args) {
    const received = Object.keys(args).map((key) => `"${key}"`).join(', ');
    return `${PlanTool.BAD_ARGS} ${received ? `This call carried: ${received}.` : 'This call carried no arguments.'}`;
  }

  static _argument(args, keys) {
    const key = keys.find((name) => args[name] !== undefined && args[name] !== null);
    return key ? args[key] : undefined;
  }

  static _numbers(value) {
    const list = Array.isArray(value) ? value : [value];
    return list.map((entry) => (typeof entry === 'string' ? entry.trim() : entry))
      .filter((entry) => entry !== '' && entry != null && typeof entry !== 'boolean' && Number.isFinite(Number(entry)))
      .map(Number);
  }

  static _tell(emit, conversationId, plan) {
    if (typeof emit !== 'function') return;
    try { emit({ type: PlanTool.EVENT, payload: { conversationId, plan } }); } catch (_) {}
  }

  static _schema() {
    return {
      type: 'object',
      properties: {
        plan: {
          type: 'array',
          description: 'Every step of the plan, in the order it will be done. Only to write the plan or change its steps.',
          items: {
            type: 'object',
            properties: {
              step: { type: 'string', description: 'What this step gets done, in a few words.' },
              status: { type: 'string', enum: [PlanSteps.PENDING, PlanSteps.IN_PROGRESS, PlanSteps.COMPLETED], description: 'Leave out for a step not started.' },
            },
            required: ['step'],
          },
        },
        done: { type: 'integer', description: 'The number (from 1) of the step you just finished.' },
        explanation: { type: 'string', description: 'One line on why the steps changed.' },
      },
    };
  }
}

module.exports = PlanTool;

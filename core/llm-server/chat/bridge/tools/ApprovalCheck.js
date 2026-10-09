const ApprovalGate = require('../../ApprovalGate');
const CallDescriber = require('../../approval/CallDescriber');
const CommandCallAssessor = require('../../approval/CommandCallAssessor');

class ApprovalCheck {
  constructor({ db, policy, toolSet, interactive, hooks, wait, timeoutMs }) {
    this._db = db;
    this._policy = policy;
    this._toolSet = toolSet;
    this._interactive = !!interactive;
    this._hooks = hooks || {};
    this._wait = wait;
    this._timeoutMs = timeoutMs;
    this._runApprovals = new Set();
  }

  async check(name, params) {
    const assessment = CommandCallAssessor.assess(name, params, {
      projectRoot: this._toolSet.injected.roots.get(name) || null,
      enabled: CommandCallAssessor.isEnabled(this._db),
    });
    if (assessment && assessment.verdict === 'deny') return ApprovalGate.deniedCommandResult(name, assessment);
    const mustAsk = !!(assessment && assessment.verdict === 'ask-always');
    if (!this._needsQuestion(name, assessment, mustAsk)) return null;
    if (this._runApprovals.has(name) && !mustAsk) return null;
    return this._ask(name, params, assessment);
  }

  _needsQuestion(name, assessment, mustAsk) {
    if (!(this._policy === 'ask' || (mustAsk && this._interactive))) return false;
    if (!ApprovalGate.requiresApproval(name, this._toolSet.mutatingDeclared, assessment)) return false;
    return !this._toolSet.injected.sandboxed.has(name);
  }

  async _ask(name, params, assessment) {
    this._emit({ phase: 'approval', tool: name, params, detail: CallDescriber.describe(name, params, assessment) });
    const decision = await this._wait.wait(this._timeoutMs || null);
    this._emit({ phase: 'approval-done', tool: name, decision });
    if (decision === 'run') this._runApprovals.add(name);
    if (decision === 'reject') return ApprovalGate.deniedResult(name, 'the user declined it.');
    if (decision === 'timeout') return ApprovalGate.deniedResult(name, 'nobody answered the approval request in time.');
    return null;
  }

  _emit(payload) {
    if (this._hooks.onToolEvent) this._hooks.onToolEvent(payload);
  }
}

module.exports = ApprovalCheck;

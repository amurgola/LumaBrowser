const ApprovalGate = require('../../ApprovalGate');
const CallDescriber = require('../../approval/CallDescriber');
const CommandCallAssessor = require('../../approval/CommandCallAssessor');

class ApprovalCheck {
  constructor({ db, policy, toolSet, interactive, hooks, wait, timeoutMs, granted, onGranted, onUsed, attention }) {
    this._db = db;
    this._policy = policy;
    this._toolSet = toolSet;
    this._interactive = !!interactive;
    this._hooks = hooks || {};
    this._wait = wait;
    this._timeoutMs = timeoutMs;
    this._runApprovals = new Set(Array.isArray(granted) ? granted.map(String) : []);
    this._onGranted = typeof onGranted === 'function' ? onGranted : null;
    this._onUsed = typeof onUsed === 'function' ? onUsed : null;
    this._attention = attention || null;
  }

  async check(name, params) {
    const assessment = CommandCallAssessor.assess(name, params, {
      projectRoot: this._toolSet.injected.roots.get(name) || null,
      enabled: CommandCallAssessor.isEnabled(this._db),
    });
    if (assessment && assessment.verdict === 'deny') return ApprovalGate.deniedCommandResult(name, assessment);
    const mustAsk = !!(assessment && assessment.verdict === 'ask-always');
    if (!this._needsQuestion(name, assessment, mustAsk)) return null;
    const key = ApprovalGate.grantKeyOf(name);
    if (this._runApprovals.has(key) && !mustAsk) {
      this._used(key);
      return null;
    }
    return this._ask(name, params, assessment);
  }

  _needsQuestion(name, assessment, mustAsk) {
    if (!(this._policy === 'ask' || (mustAsk && this._interactive))) return false;
    if (!ApprovalGate.requiresApproval(name, this._toolSet.mutatingDeclared, assessment)) return false;
    return !this._toolSet.injected.sandboxed.has(name);
  }

  async _ask(name, params, assessment) {
    const detail = CallDescriber.describe(name, params, assessment);
    const family = ApprovalGate.familyOf(name);
    this._emit({ phase: 'approval', tool: name, params, detail, ...(family ? this._grantLabel(family) : {}) });
    this._callAttention('request', detail);
    const decision = await this._wait.wait(this._timeoutMs || null);
    this._callAttention('clear');
    this._emit({ phase: 'approval-done', tool: name, decision });
    if (decision === 'run') this._grantForRun(name);
    if (decision === 'reject') return ApprovalGate.deniedResult(name, 'the user declined it.');
    if (decision === 'timeout') return ApprovalGate.deniedResult(name, 'nobody answered the approval request in time.');
    return null;
  }

  _grantForRun(name) {
    const key = ApprovalGate.grantKeyOf(name);
    this._runApprovals.add(key);
    if (this._onGranted) { try { this._onGranted(key); } catch (_) {} }
  }

  _grantLabel(family) {
    return { grants: family.label, ...(family.carry && this._onUsed ? { grantScope: 'chat' } : {}) };
  }

  _used(key) {
    if (!this._onUsed || !ApprovalGate.isCarried(key)) return;
    try { this._onUsed(key); } catch (_) {}
  }

  _callAttention(method, detail) {
    if (!this._attention || typeof this._attention[method] !== 'function') return;
    try { this._attention[method](detail); } catch (_) {}
  }

  _emit(payload) {
    if (this._hooks.onToolEvent) this._hooks.onToolEvent(payload);
  }
}

module.exports = ApprovalCheck;

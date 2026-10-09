const BridgeRun = require('./bridge/BridgeRun');
const EvalTurn = require('./bridge/eval/EvalTurn');
const PreviewSystemPrompt = require('./bridge/prompt/PreviewSystemPrompt');
const ApprovalWait = require('./bridge/waits/ApprovalWait');
const TakeoverWait = require('./bridge/waits/TakeoverWait');

class AgentChatBridge {
  constructor({ router }) {
    this.router = router;
    this.db = (router && router.db) || null;
    this._aborted = false;
    this._runs = new Set();
    this._approvalWait = new ApprovalWait();
    this._takeoverWait = new TakeoverWait();
  }

  run(options) {
    this._aborted = false;
    const run = new BridgeRun(this._runHost(), options);
    const forget = () => { this._runs.delete(run.control); };
    this._runs.add(run.control);
    let handle;
    try {
      handle = run.start();
    } catch (err) {
      forget();
      throw err;
    }
    handle.done.then(forget, forget);
    return handle;
  }

  abort() {
    this._aborted = true;
    for (const control of this._runs) {
      try { control.stop(); } catch (_) {}
    }
    this._takeoverWait.cancel('stop');
  }

  isAborted() {
    return this._aborted;
  }

  activeRunCount() {
    return this._runs.size;
  }

  respondTakeover(action) {
    return this._takeoverWait.respond(action);
  }

  respondApproval(decision) {
    return this._approvalWait.respond(decision);
  }

  hasPendingTakeover() {
    return this._takeoverWait.isPending();
  }

  hasPendingApproval() {
    return this._approvalWait.isPending();
  }

  buildPreviewSystemPrompt(options) {
    return new PreviewSystemPrompt(this.router).build(options);
  }

  runForEval(options) {
    return new EvalTurn(this.router).run(options || {});
  }

  _runHost() {
    return {
      router: this.router,
      db: this.db,
      isBridgeAborted: () => this._aborted,
      approvalWait: this._approvalWait,
      takeoverWait: this._takeoverWait,
    };
  }
}

module.exports = AgentChatBridge;

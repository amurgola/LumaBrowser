const CallHistory = require('./tool-loop/CallHistory');
const EchoedLookupCheck = require('./tool-loop/EchoedLookupCheck');
const IdenticalStreakCheck = require('./tool-loop/IdenticalStreakCheck');
const InertActionCheck = require('./tool-loop/InertActionCheck');
const InterventionLadder = require('./tool-loop/InterventionLadder');
const LoopFeedback = require('./tool-loop/LoopFeedback');
const LoopTelemetry = require('./tool-loop/LoopTelemetry');
const ResultNovelty = require('./tool-loop/ResultNovelty');
const SearchAllowanceCheck = require('./tool-loop/SearchAllowanceCheck');
const StaleSearchCheck = require('./tool-loop/StaleSearchCheck');

class ToolLoopMonitor {
  static PROGRESS_NOVELTY = 0.5;

  constructor({ searchAllowance } = {}) {
    this._history = new CallHistory();
    this._novelty = new ResultNovelty();
    this._ladder = new InterventionLadder();
    this._telemetry = new LoopTelemetry();
    this._searches = new SearchAllowanceCheck(searchAllowance);
    this._checks = [
      new IdenticalStreakCheck(), new EchoedLookupCheck(), this._searches, new InertActionCheck(), new StaleSearchCheck(),
    ];
  }

  async attempt(name, params, run) {
    const record = this._open(name, params);
    const hold = this._firstFinding((check) => check.inspectRequest(record, this._history));
    if (hold) return { result: this._heldResult(hold), ran: false };
    const outcome = await run();
    if (outcome && outcome.ran) this._settle(record, outcome.result);
    return outcome;
  }

  report() {
    return this._telemetry.snapshot({
      ladder: this._ladder,
      searchesSpent: this._searches.spent(this._history),
      searchAllowance: this._searches.allowance,
    });
  }

  _open(name, params) {
    this._telemetry.noteRequest();
    return this._history.open(name, params);
  }

  _firstFinding(inspect) {
    for (const check of this._checks) {
      let finding = null;
      try { finding = inspect(check); } catch (_) { finding = null; }
      if (finding) return finding;
    }
    return null;
  }

  _heldResult(finding) {
    const { text, level } = this._respond(finding);
    return { success: false, error: text, message: text, loopCheck: { pattern: finding.pattern, level } };
  }

  _settle(record, result) {
    record.settle(result, this._noveltyOf(result));
    this._telemetry.noteRan(record);
    if (record.madeProgress(ToolLoopMonitor.PROGRESS_NOVELTY)) this._ladder.ease();
    const note = this._firstFinding((check) => check.inspectOutcome(record, this._history));
    if (note && result && typeof result === 'object') result.loopNotice = this._respond(note).text;
  }

  _noveltyOf(result) {
    try { return this._novelty.measure(result); } catch (_) { return null; }
  }

  _respond(finding) {
    const level = this._ladder.climb();
    this._telemetry.noteFinding(finding, level);
    return { text: LoopFeedback.compose(finding, level), level };
  }
}

module.exports = ToolLoopMonitor;

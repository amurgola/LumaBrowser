const ActionTarget = require('./ActionTarget');
const CallSignature = require('./CallSignature');
const LookupTools = require('./LookupTools');

class CallRecord {
  constructor(step, name, params) {
    this.step = step;
    this.name = name;
    this.params = params;
    this.signature = CallSignature.of(name, params);
    this.query = LookupTools.queryOf(name, params);
    this.ran = false;
    this.succeeded = false;
    this.novelty = null;
    this.inertKey = null;
    this.changedPage = false;
  }

  get isSearch() {
    return this.query !== null;
  }

  settle(result, novelty) {
    this.ran = true;
    this.succeeded = !!result && result.success !== false;
    this.novelty = this.succeeded ? novelty : null;
    this._readEvidence(result);
  }

  madeProgress(noveltyBar) {
    if (this.changedPage) return true;
    return LookupTools.isLookup(this.name) && this.novelty !== null && this.novelty >= noveltyBar;
  }

  _readEvidence(result) {
    const evidence = this.succeeded ? CallRecord._evidenceOf(result) : null;
    if (!evidence) return;
    this.changedPage = evidence.outcome === 'changed';
    if (evidence.outcome === 'no_change' && evidence.stateKey) {
      this.inertKey = `${this.name}|${ActionTarget.of(this.name, this.params)}|${evidence.stateKey}`;
    }
  }

  static _evidenceOf(result) {
    const evidence = (result.data && result.data.evidence) || result.evidence;
    return evidence && evidence.outcome ? evidence : null;
  }
}

module.exports = CallRecord;

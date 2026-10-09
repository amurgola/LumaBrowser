const LoopCheck = require('./LoopCheck');
const LookupTools = require('./LookupTools');
const QueryResemblance = require('./QueryResemblance');

class EchoedLookupCheck extends LoopCheck {
  static PATTERN = 'echoed-lookup';
  static RESEMBLANCE_BAR = 0.8;

  constructor() {
    super(EchoedLookupCheck.PATTERN);
  }

  inspectRequest(record, history) {
    if (!LookupTools.isLookup(record.name)) return null;
    const same = history.lastSucceededBefore(record, (earlier) => earlier.signature.matches(record.signature));
    if (same) return this._hold(record, { earlierStep: same.step, reworded: false });
    const similar = this._rewordedOrigin(record, history);
    if (similar) return this._hold(record, { earlierStep: similar.step, reworded: true, earlierQuery: similar.query });
    return null;
  }

  _rewordedOrigin(record, history) {
    if (!record.isSearch) return null;
    return history.lastSucceededBefore(record, (earlier) => earlier.name === record.name && earlier.isSearch
      && QueryResemblance.between(earlier.query, record.query) >= EchoedLookupCheck.RESEMBLANCE_BAR);
  }
}

module.exports = EchoedLookupCheck;

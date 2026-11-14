const LoopCheck = require('./LoopCheck');

class UncompiledReadsCheck extends LoopCheck {
  static PATTERN = 'uncompiled-reads';
  static COMPILE_TOOL = 'compile_endpoint';
  static PAGE_READS = new Set(['extract_data', 'get_element', 'collect_list', 'get_source', 'observe_page', 'screenshot']);
  static STREAK = 4;

  static appliesTo(modeTools) {
    return Array.isArray(modeTools) && modeTools.includes(UncompiledReadsCheck.COMPILE_TOOL);
  }

  constructor() {
    super(UncompiledReadsCheck.PATTERN);
  }

  inspectOutcome(record, history) {
    if (!UncompiledReadsCheck.PAGE_READS.has(record.name)) return null;
    const reads = history.ranStreak((r) => UncompiledReadsCheck.PAGE_READS.has(r.name));
    return reads % UncompiledReadsCheck.STREAK === 0 ? this._annotate(record, { reads }) : null;
  }
}

module.exports = UncompiledReadsCheck;

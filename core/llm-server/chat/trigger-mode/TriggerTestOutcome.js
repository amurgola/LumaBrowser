const TestRunOutcome = require('../scheduled-task/TestRunOutcome');

class TriggerTestOutcome {
  static from(result) {
    const out = TestRunOutcome.from(result);
    if (!out.ran) return out;
    const run = result.run || {};
    if (run.responseBody !== undefined) out.webhookResponseBody = run.responseBody;
    const tools = TriggerTestOutcome._toolsCalled(run.toolTrace);
    if (tools) out.toolsCalled = tools;
    const warning = TriggerTestOutcome._filterWarning(result.gating);
    if (warning) out.warning = warning;
    return out;
  }

  static _toolsCalled(trace) {
    if (!Array.isArray(trace) || !trace.length) return null;
    return trace.map((t) => t && (t.tool || t.name)).filter(Boolean);
  }

  static _filterWarning(gating) {
    if (!gating || !gating.filter || gating.filter.pass) return null;
    return `this sample would NOT pass the live filter (failed: ${gating.filter.failed.join(', ')}); real events like it will be logged as filtered`;
  }
}

module.exports = TriggerTestOutcome;

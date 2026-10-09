class TestRunOutcome {
  static RESPONSE_CHARS = 2000;

  static from(result) {
    if (!result || !result.success) {
      return { ran: false, error: (result && result.error) || 'test run could not start' };
    }
    const run = result.run || {};
    const out = { ran: true, status: run.status || 'unknown' };
    if (run.error) out.error = run.error;
    if (run.response) TestRunOutcome._attachResponse(out, String(run.response));
    return out;
  }

  static _attachResponse(out, response) {
    out.response = response.slice(0, TestRunOutcome.RESPONSE_CHARS);
    if (response.length > TestRunOutcome.RESPONSE_CHARS) out.responseTruncated = true;
  }
}

module.exports = TestRunOutcome;

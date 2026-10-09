const RecordId = require('../../../core/database/RecordId');

class TestRunLog {
  constructor(testId, variantId, config) {
    this.runId = RecordId.create('run');
    this.testId = testId;
    this.variantId = variantId || '';
    this.config = config || {};
    this.status = 'running';
    this.startedAt = new Date().toISOString();
    this.completedAt = null;
    this.durationMs = 0;

    this.assertions = [];
    this.notes = [];
    this.toolCalls = [];
    this.conversationHistory = [];
    this.finalResponse = '';
    this.iterations = 0;
    this.error = null;
  }

  addAssertion(name, passed, detail) {
    this.assertions.push({
      name,
      passed,
      detail: typeof detail === 'string' ? detail : JSON.stringify(detail),
      timestamp: new Date().toISOString(),
    });
  }

  note(message, data) {
    this.notes.push({ message, data: data !== undefined ? data : null, timestamp: new Date().toISOString() });
  }

  addToolCall(entry) {
    this.toolCalls.push({
      iteration: entry.iteration,
      tool: entry.tool,
      params: entry.params,
      result: entry.result,
      timestamp: entry.timestamp || new Date().toISOString(),
      durationMs: entry.durationMs || 0,
    });
  }

  complete(agentResult) {
    this._finish('completed');
    if (agentResult) this._mergeAgentResult(agentResult);
  }

  fail(error) {
    this._finish('error');
    this.error = typeof error === 'string' ? error : error.message || String(error);
  }

  timeout() {
    this._finish('timeout');
    this.error = `Test timed out after ${this.durationMs}ms`;
  }

  toSummary() {
    const passCount = this.assertions.filter((a) => a.passed).length;
    const failCount = this.assertions.filter((a) => !a.passed).length;
    return {
      id: this.runId,
      test_id: this.testId,
      variant_id: this.variantId,
      status: this.status,
      started_at: this.startedAt,
      completed_at: this.completedAt,
      config: JSON.stringify(this.config),
      assertions: JSON.stringify(this.assertions),
      summary: `${passCount} passed, ${failCount} failed, ${this.iterations} iterations`,
      duration_ms: this.durationMs,
    };
  }

  toFullLog() {
    return {
      id: 'log_' + this.runId,
      run_id: this.runId,
      full_log: JSON.stringify({
        conversationHistory: this.conversationHistory,
        toolCalls: this.toolCalls,
        finalResponse: this.finalResponse,
        iterations: this.iterations,
        notes: this.notes,
        error: this.error,
      }),
    };
  }

  _finish(status) {
    this.completedAt = new Date().toISOString();
    this.durationMs = new Date(this.completedAt) - new Date(this.startedAt);
    this.status = status;
  }

  _mergeAgentResult(agentResult) {
    this.finalResponse = agentResult.finalResponse || '';
    this.iterations = agentResult.iterations || 0;
    this.conversationHistory = agentResult.conversationHistory || [];
    this.toolCalls = agentResult.toolCalls || this.toolCalls;
    if (agentResult.error) {
      this.error = agentResult.error;
      this.status = 'error';
    }
  }
}

module.exports = TestRunLog;

const ExpectationMatcher = require('./ExpectationMatcher');

class TurnChecks {
  static DEFAULT_ITERATIONS_WEIGHT = 0.5;

  constructor(expect, transcript, addCheck) {
    this._expect = expect || {};
    this._transcript = transcript || {};
    this._calls = Array.isArray(this._transcript.toolCalls) ? this._transcript.toolCalls : [];
    this._add = addCheck;
    this._matchedIndexes = [];
  }

  collect() {
    this._checkCompletion();
    this._checkExpectedToolCalls();
    this._checkOrdering();
    this._checkForbiddenTools();
    this._checkIterationCeiling();
    this._checkFinalAnswer();
    this._checkExecution();
  }

  _checkCompletion() {
    if (this._expect.mustComplete === false) return;
    const error = this._transcript.error;
    this._add('completed without error', !error, 1, error ? `error: ${error}` : '');
  }

  _checkExpectedToolCalls() {
    for (const spec of this._specs()) {
      const index = this._calls.findIndex((call) => ExpectationMatcher.callMatches(spec, call));
      this._matchedIndexes.push(index);
      this._addToolCallCheck(spec, index);
    }
  }

  _addToolCallCheck(spec, index) {
    const label = `tool ${spec.tool || '*'} ${TurnChecks._describeSpec(spec)}`.trim();
    if (spec.required === false) {
      this._add(`optional ${label}`, true, 0, index >= 0 ? 'present' : 'absent (ok)');
      return;
    }
    this._add(label, index >= 0, spec.weight, index >= 0 ? `matched call #${index}` : 'no matching call');
  }

  _checkOrdering() {
    if (!this._expect.ordered || this._specs().length <= 1) return;
    const indexes = this._matchedIndexes;
    const allPresent = indexes.every((i) => i >= 0);
    const present = indexes.filter((i) => i >= 0);
    const monotonic = present.every((value, k) => k === 0 || present[k - 1] <= value);
    let detail = 'not all present';
    if (allPresent) detail = monotonic ? '' : `out of order: [${indexes.join(', ')}]`;
    this._add('tool calls in expected order', allPresent && monotonic, 1, detail);
  }

  _checkForbiddenTools() {
    const forbidden = this._expect.forbiddenTools;
    if (!Array.isArray(forbidden) || !forbidden.length) return;
    const used = this._calls.map((call) => call.tool);
    if (forbidden.includes(ExpectationMatcher.WILDCARD_TOOL)) {
      this._add('used no tools', used.length === 0, 1, used.length ? `called: ${used.join(', ')}` : '');
      return;
    }
    const usedSet = new Set(used);
    const hit = forbidden.filter((tool) => usedSet.has(tool));
    this._add('avoided forbidden tools', hit.length === 0, 1, hit.length ? `used: ${hit.join(', ')}` : '');
  }

  _checkIterationCeiling() {
    const ceiling = this._expect.maxIterations;
    if (ceiling == null) return;
    const used = this._transcript.iterations == null ? this._calls.length : this._transcript.iterations;
    const weight = this._expect.maxIterationsWeight == null ? TurnChecks.DEFAULT_ITERATIONS_WEIGHT : this._expect.maxIterationsWeight;
    this._add(`<= ${ceiling} iterations`, used <= ceiling, weight, `used ${used}`);
  }

  _checkFinalAnswer() {
    const answer = this._expect.finalAnswer;
    if (!answer) return;
    const text = String(this._transcript.finalResponse || '');
    const lower = text.toLowerCase();
    const weight = answer.weight == null ? 1 : answer.weight;
    for (const s of TurnChecks._asArray(answer.contains)) {
      this._add(`answer contains "${s}"`, lower.includes(String(s).toLowerCase()), weight);
    }
    for (const s of TurnChecks._asArray(answer.notContains)) {
      this._add(`answer omits "${s}"`, !lower.includes(String(s).toLowerCase()), weight);
    }
    if (answer.regex != null) {
      this._add(`answer matches /${answer.regex}/`, ExpectationMatcher.safeRegex(answer.regex, answer.flags).test(text), weight);
    }
  }

  _checkExecution() {
    if (!this._expect.execution) return;
    const weight = this._expect.execution.weight == null ? 1 : this._expect.execution.weight;
    const execution = this._transcript.execution || null;
    if (!execution || !execution.ran) {
      this._add('code executed', false, weight, (execution && execution.error) ? execution.error : 'no execution result');
      return;
    }
    const cases = Array.isArray(execution.cases) ? execution.cases : [];
    if (!cases.length) {
      this._add('code executed', true, weight, 'ran, no cases');
      return;
    }
    cases.forEach((c, i) => this._add(`case ${i + 1} correct`, !!c.passed, weight, c.detail || ''));
  }

  _specs() {
    return Array.isArray(this._expect.toolCalls) ? this._expect.toolCalls : [];
  }

  static _describeSpec(spec) {
    const bits = [];
    if (spec.params) bits.push('params ' + Object.keys(spec.params).join(','));
    if (spec.success !== undefined) bits.push('success=' + spec.success);
    return bits.length ? `(${bits.join('; ')})` : '';
  }

  static _asArray(value) {
    if (value == null) return [];
    return Array.isArray(value) ? value : [value];
  }
}

module.exports = TurnChecks;

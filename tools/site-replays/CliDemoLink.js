const FakeBridgeLink = require('./FakeBridgeLink');

class CliDemoLink extends FakeBridgeLink {
  static MODEL = 'local::qwen3.8-flash-q4';
  static EDIT = { path: 'src/math.js', edits: [{ oldText: 'return a - b;', newText: 'return a + b;' }] };
  static TOOL_FENCE = '```tool\n{"tool":"edit_file"';
  static THOUGHTS = 'The user wants the failing test fixed. First I should look at the test file, then the module it covers. '
    + 'The test name mentions add, so the arithmetic helper is the likely suspect. I will read the test to see the exact expectation, '
    + 'then grep for the call sites so I know whether anything else depends on the current behaviour before I change it. '
    + 'If the implementation is simply wrong, a one-line edit plus a re-run of the suite is enough; if the test is wrong instead, I should say so rather than bend the code to it. ';
  static TEST_OUTPUT = ['> luma-demo@1.0.0 test', '> jest tests/math.test.js', '', 'PASS tests/math.test.js', '  add', '    ✓ adds two numbers (3 ms)', '    ✓ handles negatives (1 ms)', '', 'Test Suites: 1 passed, 1 total', 'Tests:       2 passed, 2 total', 'Time:        0.412 s'];
  static ANSWER = '## Fixed\n\nThe bug was in `src/math.js`: the function subtracted instead of adding.\n\n- Changed `return a - b;` to `return a + b;`\n- Re-ran the suite: **2 passed**\n\n| Check | Result |\n|---|---|\n| Unit tests | green |\n| Lint | not run |\n\nNothing else references the old behaviour, so this is safe to ship.';

  constructor({ autoApprove = false } = {}) {
    super();
    this._autoApprove = autoApprove;
    this.turns = 0;
    this.aborted = false;
    this.decision = null;
  }

  async send(type, payload) {
    if (type === 'hello') return this._ready(payload);
    if (type === 'list-agents') return this._agents();
    if (type === 'approve') { this.decision = payload.decision; return undefined; }
    if (type === 'abort') { this.aborted = true; return undefined; }
    if (type === 'prompt') return this._turn();
    return undefined;
  }

  async _ready(payload) {
    await FakeBridgeLink.sleep(50);
    this.push('ready', { conversationId: 'conv_demo', agent: payload.agent ? { id: 'a1', name: payload.agent } : null, model: CliDemoLink.MODEL, root: payload.cwd, resumedMessages: 0, approval: payload.approval });
  }

  async _agents() {
    await FakeBridgeLink.sleep(80);
    this.push('agents', { agents: [
      { id: 'a1', name: 'reviewer', description: 'Reviews diffs and flags risky changes.', model: CliDemoLink.MODEL, tools: 9, kbDocs: 2 },
      { id: 'a2', name: 'writer', description: 'Writes docs in the house style.', model: 'anthropic::claude-sonnet-5', tools: 4, kbDocs: 0 },
    ] });
  }

  async _turn() {
    this.turns += 1;
    this.aborted = false;
    this.push('meta', { conversationId: 'conv_demo' });
    this.push('status', { phase: 'starting-server' });
    await FakeBridgeLink.sleep(600);
    await this._words('reasoning-delta', CliDemoLink.THOUGHTS, 35);
    await FakeBridgeLink.sleep(200);
    await this._investigate();
    if (this.aborted) { this.push('done', { aborted: true, finishReason: 'abort', iterations: 2 }); return; }
    await this._words('delta', 'The test expects `add(2, 2)` to return **4** but the implementation subtracts. Fixing it now.\n\n', 30);
    await this._askApproval();
    if (this.decision === 'reject') { await this._rejected(); return; }
    await this._applyAndTest();
    await this._answer();
  }

  async _investigate() {
    this.push('tool', { phase: 'pending', tool: 'read_file', target: 'tests/math.test.js' });
    await FakeBridgeLink.sleep(400);
    this.push('tool', { phase: 'pending', tool: 'read_file', target: 'tests/math.test.js', chars: 64 });
    await FakeBridgeLink.sleep(300);
    this.push('tool', { phase: 'run', tool: 'read_file', params: { path: 'tests/math.test.js' } });
    await FakeBridgeLink.sleep(500);
    this.push('tool', { phase: 'done', tool: 'read_file', success: true, summary: 'tests/math.test.js · 42 lines (whole)' });
    this.push('tool', { phase: 'run', tool: 'grep', params: { pattern: 'add\\(', path: 'src' } });
    await FakeBridgeLink.sleep(350);
    this.push('tool', { phase: 'done', tool: 'grep', success: true, summary: '/add\\(/ · 3 matches' });
  }

  async _askApproval() {
    this.push('delta', { text: CliDemoLink.TOOL_FENCE });
    await FakeBridgeLink.sleep(200);
    this.push('rollback', { chars: CliDemoLink.TOOL_FENCE.length + 1 });
    this.decision = null;
    this.push('tool', { phase: 'approval', tool: 'edit_file', params: CliDemoLink.EDIT, detail: 'Edit src/math.js (1 replacement)' });
    if (this._autoApprove) { await FakeBridgeLink.sleep(1200); this.decision = 'once'; }
    while (!this.decision) await FakeBridgeLink.sleep(50);
    this.push('tool', { phase: 'approval-done', tool: 'edit_file', decision: this.decision });
  }

  async _rejected() {
    await this._words('delta', 'Understood, I left `src/math.js` untouched. The fix is a one-line change to the return statement.', 30);
    this.push('done', { finishReason: 'stop', iterations: 3, usage: { total_tokens: 2140 }, contextWindow: 32768 });
  }

  async _applyAndTest() {
    this.push('tool', { phase: 'run', tool: 'edit_file', params: CliDemoLink.EDIT });
    await FakeBridgeLink.sleep(500);
    this.push('tool', { phase: 'done', tool: 'edit_file', success: true, summary: 'src/math.js · 1 edit' });
    this.push('tool', { phase: 'run', tool: 'run_command', params: { command: 'npm test -- tests/math.test.js' } });
    for (const line of CliDemoLink.TEST_OUTPUT) { this.push('command:output', { command: 'npm test', chunk: `${line}\n` }); await FakeBridgeLink.sleep(120); }
    this.push('tool', { phase: 'done', tool: 'run_command', success: true, summary: 'npm test -- tests/math.test.js · exit 0' });
    await FakeBridgeLink.sleep(200);
  }

  async _answer() {
    await this._words('delta', CliDemoLink.ANSWER, 20);
    this.push('done', { finishReason: 'stop', iterations: 5, usage: { total_tokens: 4120 }, contextWindow: 32768, timings: { predicted_per_second: 61.4 } });
    await FakeBridgeLink.sleep(900);
    this.push('suggest', { text: 'Run the linter on src and fix anything it flags' });
  }

  async _words(type, text, ms) {
    for (const word of text.split(' ')) { this.push(type, { text: `${word} ` }); await FakeBridgeLink.sleep(ms); }
  }
}

module.exports = CliDemoLink;

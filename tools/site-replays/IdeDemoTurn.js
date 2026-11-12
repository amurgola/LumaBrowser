class IdeDemoTurn {
  static PROMPT = 'Fix the failing range test';
  static CONTEXT = [{ id: 'c1', kind: 'selection', path: 'src/range.js', startLine: 3, endLine: 9 }];

  static state(over) {
    return {
      status: 'ready', statusMessage: '', agent: { id: 'reviewer', name: 'Reviewer' }, model: 'local::Qwen3.8-Flash-Q6_K',
      root: 'C:\\Users\\dev\\projects\\my-app', approval: 'ask', streaming: false, resumedMessages: 0, conversationId: 'conv_1',
      showReasoning: false, suggest: true, ideName: 'WebStorm', context: [], ...over,
    };
  }

  static TURN = [
    ['status', { phase: 'switching-model' }],
    ['status', { phase: 'starting-server' }],
    ['reasoning-delta', { text: 'The user wants the failing test fixed. I should look at the test first, then the implementation. ' }],
    ['reasoning-delta', { text: 'Likely an off-by-one in the range helper.' }],
    ['tool', { phase: 'pending', tool: 'read_file', target: 'tests/range.test.js' }],
    ['tool', { phase: 'run', tool: 'read_file', params: { path: 'tests/range.test.js' } }],
    ['tool', { phase: 'done', tool: 'read_file', success: true, summary: 'tests/range.test.js · 42 lines (whole)' }],
    ['tool', { phase: 'run', tool: 'grep', params: { pattern: 'function range', glob: 'src/**' } }],
    ['tool', { phase: 'done', tool: 'grep', success: true, summary: '1 match in 1 file' }],
    ['tool', { phase: 'approval', tool: 'edit_file', params: { path: 'src/range.js', edits: [{ oldText: 'for (let i = start; i < end; i++)', newText: 'for (let i = start; i <= end; i++)' }] }, detail: 'Edit src/range.js (1 replacement)' }],
    ['tool', { phase: 'approval-done', tool: 'edit_file', decision: 'once' }],
    ['tool', { phase: 'run', tool: 'edit_file', params: { path: 'src/range.js', edits: [{ oldText: 'for (let i = start; i < end; i++) {\n  out.push(i);\n}', newText: 'for (let i = start; i <= end; i++) {\n  out.push(i);\n}' }] } }],
    ['tool', { phase: 'done', tool: 'edit_file', success: true, summary: 'src/range.js · 1 edit' }],
    ['tool', { phase: 'run', tool: 'run_command', params: { command: 'npm test -- range' } }],
    ['command:output', { command: 'npm test -- range', chunk: '> my-app@1.0.0 test\n> jest range\n\n' }],
    ['command:output', { command: 'npm test -- range', chunk: 'PASS tests/range.test.js\n  range\n    ✓ includes the end (3 ms)\n\nTests: 1 passed, 1 total\n' }],
    ['tool', { phase: 'done', tool: 'run_command', success: true, summary: 'npm test -- range · exit 0' }],
    ['delta', { text: 'The range helper stopped one short of `end`. I changed the loop bound in ' }],
    ['delta', { text: '`src/range.js` and the test passes now.\n\n```js\nfor (let i = start; i <= end; i++) {\n  out.push(i);\n}\n```\n\n' }],
    ['delta', { text: '- **Root cause**: `<` instead of `<=`\n- **Files**: `src/range.js`\n' }],
    ['done', { finishReason: 'stop', usage: { total_tokens: 4123 }, timings: { predicted_per_second: 61.2 }, iterations: 5 }],
    ['suggest', { text: 'Add a test for an empty range' }],
  ];
}

module.exports = IdeDemoTurn;

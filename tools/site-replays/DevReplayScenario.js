const ReplayTimeline = require('./ReplayTimeline');

class DevReplayScenario {
  static PROMPT = 'The cart discount test is failing. Find out why and fix it.';
  static AGENT = { id: 'reviewer', name: 'reviewer' };
  static MODEL = 'local::Qwen3.8-27B-UD-Q6_K_M';
  static ROOT_LABEL = '~/projects/storefront';
  static SUGGESTION = 'Add a test for a 100% discount code';

  static CART_JS = [
    "const { lookupCode } = require('./codes');",
    '',
    '/** Sum the line items, in cents. */',
    'function subtotal(items) {',
    '  return items.reduce((sum, it) => sum + it.price * it.qty, 0);',
    '}',
    '',
    '/** Apply a percent-off code to a subtotal. */',
    'function applyDiscount(total, code) {',
    '  const pct = lookupCode(code);',
    '  if (!pct) return total;',
    '  return total - pct;',
    '}',
    '',
    'function cartTotal(items, code) {',
    '  return applyDiscount(subtotal(items), code);',
    '}',
    '',
    'module.exports = { subtotal, applyDiscount, cartTotal };',
  ].join('\n');

  static OLD_LINE = '  return total - pct;';
  static NEW_LINE = '  return Math.round(total * (1 - pct / 100));';

  static FAIL_OUT = [
    '> storefront@2.4.0 test',
    '> jest cart',
    '',
    'FAIL tests/cart.test.js',
    '  cartTotal',
    '    ✓ sums line items (2 ms)',
    '    ✕ applies a percent discount code (4 ms)',
    '',
    '  ● cartTotal › applies a percent discount code',
    '    Expected: 7200',
    '    Received: 7980',
    '',
    'Tests:       1 failed, 1 passed, 2 total',
  ];

  static PASS_OUT = [
    '> storefront@2.4.0 test',
    '> jest cart',
    '',
    'PASS tests/cart.test.js',
    '  cartTotal',
    '    ✓ sums line items (2 ms)',
    '    ✓ applies a percent discount code (1 ms)',
    '',
    'Tests:       2 passed, 2 total',
    'Time:        0.38 s',
  ];

  static REASONING = 'The user has a failing discount test. I should run the cart tests first to see the actual failure, '
    + 'then read the test and the code it covers before changing anything. If the expectation is right and the code is wrong, '
    + 'a small edit and a second test run will settle it.';

  static ANSWER = '## Fixed\n\n'
    + '`applyDiscount` subtracted the percentage as if it were cents: a 10% code took 10 cents off an $80.00 cart instead of $8.00.\n\n'
    + '- `src/cart.js`: the discount is now `total * (1 - pct / 100)`, rounded to whole cents\n'
    + '- `npm test -- cart`: **2 passed**\n\n'
    + 'Nothing else calls `applyDiscount`, so the change stays inside the cart module.';

  static EXPLANATION = 'The test is right and the code is wrong: `applyDiscount` subtracts the percent value itself instead of '
    + 'that share of the total. Fixing the one line.\n\n';

  static timeline() {
    const t = new ReplayTimeline();
    t.add(0, 'meta', { conversationId: 'conv_storefront' });
    t.stream('reasoning-delta', DevReplayScenario.REASONING);
    DevReplayScenario._investigate(t);
    t.stream('delta', DevReplayScenario.EXPLANATION);
    DevReplayScenario._fix(t);
    t.command('npm test -- cart', DevReplayScenario.PASS_OUT, 'npm test -- cart · exit 0', true);
    t.stream('delta', DevReplayScenario.ANSWER);
    t.add(200, 'done', { finishReason: 'stop', iterations: 7, usage: { total_tokens: 6480 }, contextWindow: 32768, timings: { predicted_per_second: 68.3 } });
    t.add(1100, 'suggest', { text: DevReplayScenario.SUGGESTION });
    return t.entries();
  }

  static _investigate(t) {
    t.command('npm test -- cart', DevReplayScenario.FAIL_OUT, 'npm test -- cart · exit 1', false);
    t.tool('read_file', { path: 'tests/cart.test.js' }, 'tests/cart.test.js', 'tests/cart.test.js · 31 lines (whole)', 520);
    t.tool('grep', { pattern: 'applyDiscount', path: 'src' }, 'applyDiscount', '/applyDiscount/ · 3 matches in 1 file', 420);
    t.tool('read_file', { path: 'src/cart.js' }, 'src/cart.js', 'src/cart.js · 19 lines (whole)', 480);
  }

  static _fix(t) {
    const edit = { path: 'src/cart.js', edits: [{ oldText: DevReplayScenario.OLD_LINE, newText: DevReplayScenario.NEW_LINE }] };
    t.add(500, 'tool', { phase: 'approval', tool: 'edit_file', params: edit, detail: 'Edit src/cart.js (1 replacement)' });
    t.add(1900, '@approve');
    t.add(120, 'tool', { phase: 'approval-done', tool: 'edit_file', decision: 'once' });
    t.add(80, 'tool', { phase: 'run', tool: 'edit_file', params: edit });
    t.add(450, 'tool', { phase: 'done', tool: 'edit_file', success: true, summary: 'src/cart.js · 1 edit' });
    t.add(0, '@edited');
  }
}

module.exports = DevReplayScenario;

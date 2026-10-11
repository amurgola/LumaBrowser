/** @jest-environment jsdom */
const fs = require('fs');
const path = require('path');
const { transformSync } = require('@babel/core');

function renderer(relative, imports = () => ({})) {
  const source = fs.readFileSync(path.join(__dirname, '../../..', relative), 'utf8');
  const code = transformSync(source, { configFile: false, babelrc: false, plugins: ['@babel/plugin-transform-modules-commonjs'] }).code;
  const exports = {};
  new Function('require', 'exports', code)(imports, exports);
  return exports.default;
}
const escaper = renderer('core/llm-server/ui/js/format/HtmlEscaper.js');
const Card = renderer('ui/shell/settings/providers/EditableProviderCard.js', (name) => {
  if (name.includes('HtmlEscaper')) return escaper;
  if (name.includes('DefaultProviderOptions')) return { TYPE_LABELS: { openai: 'OpenAI-Compatible' } };
  return {};
});
const Reducer = renderer('extensions/ai-chat/ui/lite-panel/LiteChatReducer.js');
const Meter = renderer('core/llm-server/ui/js/chat/composer/UsageMeter.js');
const Panel = renderer('extensions/ai-chat/ui/lite-panel/LitePanel.js');

let config, ctx, card;
beforeEach(() => {
  config = { id: 'p', type: 'openai', endpoint: 'http://localhost:11434', name: 'Ollama',
    selectedModel: 'qwen', models: [{ id: 'qwen' }, { id: 'other' }], contextWindows: { other: 32768 } };
  ctx = { list: { save: jest.fn(), render: jest.fn() }, feedback: { toast: jest.fn() }, pingChat: jest.fn() };
  card = Card.build(config, ctx);
});
const field = (name) => card.querySelector(`[data-field="${name}"]`);

test('per-model custom budget saves, other model budgets survive, blank restores auto', async () => {
  expect(field('contextWindow').value).toBe('');
  field('contextWindow').value = '131072';
  await Card._save(card, config, ctx);
  expect(config.contextWindows).toEqual({ other: 32768, qwen: 131072 });
  field('selectedModel').value = 'other';
  field('selectedModel').dispatchEvent(new Event('change'));
  expect(field('contextWindow').value).toBe('32768');
  field('contextWindow').value = '';
  await Card._save(card, config, ctx);
  expect(config.contextWindows).toEqual({ qwen: 131072 });
});

test.each(['-1', '0', '3.14', '9007199254740992'])('invalid budget %s is rejected before saving', async (value) => {
  field('contextWindow').value = value;
  await Card._save(card, config, ctx);
  expect(ctx.list.save).not.toHaveBeenCalled();
  expect(ctx.feedback.toast).toHaveBeenCalledWith(expect.any(String), 'bad');
  expect(config.contextWindows).toEqual({ other: 32768 });
});

test('changing endpoint clears budgets belonging to the old backend', async () => {
  field('selectedModel').value = 'other';
  field('selectedModel').dispatchEvent(new Event('change'));
  field('endpoint').value = 'http://localhost:1234';
  field('endpoint').dispatchEvent(new Event('input'));
  expect(field('contextWindow').value).toBe('');
  await Card._save(card, config, ctx);
  expect(config.contextWindows).toEqual({});
});

test('the model context remains visible after completion and resets for the next turn', () => {
  const context = { tokens: 131072, source: 'ollama', estimated: false };
  let state = Reducer.startTurn(Reducer.createInitialState());
  state = Reducer.reduce(state, { type: 'context', payload: context });
  state = Reducer.reduce(state, { type: 'done', payload: {} });
  expect(Reducer.contextLabel(state.context)).toBe('Context: 131,072 tokens (ollama)');
  expect(Reducer.startTurn(state).context).toBeNull();
});

test('fallback is labeled in sidebar and usage tooltip rather than presented as detected', () => {
  expect(Reducer.contextLabel({ estimated: true, notice: 'Context unknown' })).toBe('Context unknown');
  expect(Meter.view({ in: 100, out: 50, estimated: true }, 4096).title).toMatch(/Backend context unknown; safety budget/);
  expect(Meter.view({ in: 100, out: 50 }, 131072).title).not.toMatch(/unknown/);
});

test('selecting another model clears the previous context display without probing or loading', () => {
  const panel = { modelSelect: { value: 'other::model' }, state: { context: { tokens: 131072 } },
    api: { setLastModelRef: jest.fn() }, _renderStreaming: jest.fn() };
  Panel.prototype._onModelPicked.call(panel, 'other::model');
  expect(panel.state.context).toBeNull();
  expect(panel._renderStreaming).toHaveBeenCalled();
});

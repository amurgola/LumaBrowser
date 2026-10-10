/** @jest-environment jsdom */
const fs = require('fs');
const path = require('path');
const { transformSync } = require('@babel/core');
const ModelDispatcher = require('../core/llm-server/chat/router/ModelDispatcher');

// Load renderer ESM in Jest's CJS runtime, isolating unrelated wizard UI imports.
const source = fs.readFileSync(path.join(__dirname, '../core/shell/ui/wizard/WizardFinisher.js'), 'utf8');
const compiled = transformSync(source, { configFile: false, babelrc: false, plugins: ['@babel/plugin-transform-modules-commonjs'] }).code;
const rendererExports = {};
const imports = (name) => {
  if (name === './WorkflowPresets.js') return { needsLlm: () => true };
  return {};
};
new Function('require', 'exports', compiled)(imports, rendererExports);
const WizardFinisher = rendererExports.default;

let configs, finisher;
const llm = {
  mode: 'remote', type: 'openai', endpoint: 'http://localhost:11434',
  apiKey: 'ollama', models: [{ id: 'test-model' }], selectedModel: 'test-model',
};
beforeEach(() => {
  configs = [];
  window.ipcBridge = {
    getProviderConfigs: async () => configs,
    saveProviderConfigs: async (value) => { configs = value; },
  };
  finisher = new WizardFinisher({ state: { llm }, enabledExtensions: () => ['ai-chat'] });
  finisher._seedSlots = jest.fn();
});
afterEach(() => { delete window.ipcBridge; });

test('new wizard provider has an ID that routes chat and slots to the saved connection', async () => {
  await finisher._applyRemoteLlm();
  const saved = configs[0];
  expect(saved.id).toMatch(/^provider_.+/);
  expect(finisher._seedSlots).toHaveBeenCalledWith(saved.id, 'test-model', false);
  const remoteStream = { stream: jest.fn() };
  const dispatcher = new ModelDispatcher({ db: { get: () => configs }, remoteStream });
  dispatcher._route(`${saved.id}::test-model`, [], 0, {}, [], null, null);
  expect(remoteStream.stream).toHaveBeenCalledWith(saved, 'test-model', [], 0, {}, null);
});

test('rerunning setup preserves the existing provider ID and other provider types', async () => {
  const other = { id: 'other-provider', type: 'anthropic', endpoint: 'https://example.com' };
  configs = [{ ...llm, id: 'existing-provider' }, other];
  await finisher._applyRemoteLlm();
  expect(configs).toHaveLength(2);
  expect(configs).toContain(other);
  expect(configs.find((c) => c.type === 'openai').id).toBe('existing-provider');
  expect(finisher._seedSlots).toHaveBeenCalledWith('existing-provider', 'test-model', false);
});

test('rerunning setup repairs a legacy entry without an ID and keeps it stable', async () => {
  configs = [{ ...llm }];
  await finisher._applyRemoteLlm();
  const id = configs[0].id;
  expect(id).toMatch(/^provider_.+/);
  await finisher._applyRemoteLlm();
  expect(configs).toHaveLength(1);
  expect(configs[0].id).toBe(id);
});

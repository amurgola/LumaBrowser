/** @jest-environment jsdom */
const fs = require('fs');
const path = require('path');
const { transformSync } = require('@babel/core');

// Renderer modules are ESM; load this isolated DOM component in Jest's CJS runtime.
const source = fs.readFileSync(path.join(__dirname, '../extensions/ai-chat/ui/lite-panel/LiteModelPicker.js'), 'utf8');
const compiled = transformSync(source, { configFile: false, babelrc: false, plugins: ['@babel/plugin-transform-modules-commonjs'] }).code;
const rendererExports = {};
new Function('exports', compiled)(rendererExports);
const LiteModelPicker = rendererExports.default;

let picker, button, onPick;
const models = [
  { ref: 'ollama::qwen3.5:9b-q4', label: 'Ollama: Qwen 3.5 9B Q4' },
  { ref: 'ollama::qwen3:32b', label: 'Ollama: Qwen 3 32B' },
  { ref: 'studio::gemma:9b', label: 'LM Studio: Gemma 9B' },
];
const search = (query) => {
  picker.input.value = query;
  picker.input.dispatchEvent(new Event('input'));
};
const key = (value) => picker.input.dispatchEvent(new KeyboardEvent('keydown', { key: value, bubbles: true }));

beforeEach(() => {
  document.body.innerHTML = '<button id="model">Models</button><button id="outside">Outside</button>';
  button = document.getElementById('model');
  onPick = jest.fn();
  picker = new LiteModelPicker(button, onPick);
  picker.render(models, models[1].ref);
});
afterEach(() => picker.destroy());

test('filters a large list by multiple case-insensitive terms without changing selection', () => {
  picker.render([...models, ...Array.from({ length: 200 }, (_, i) => ({ ref: `other::model-${i}` }))], models[1].ref);
  button.click();
  search('QWEN 9b');
  expect(picker.list.children).toHaveLength(1);
  expect(picker.count.textContent).toBe('1 of 203 models');
  expect(picker.selectedRef).toBe(models[1].ref);
  expect(onPick).not.toHaveBeenCalled();
  key('Enter');
  expect(onPick).toHaveBeenCalledWith(models[0].ref);
  expect(picker.pop.hidden).toBe(true);
  expect(document.activeElement).toBe(button);
});

test('supports arrow navigation and Escape cancellation without bubbling to chat', () => {
  picker.open();
  search('9b');
  key('ArrowDown');
  expect(picker.input.getAttribute('aria-activedescendant')).toBe(picker.list.children[1].id);
  key('ArrowUp');
  expect(picker.active).toBe(0);
  const onEscape = jest.fn();
  document.addEventListener('keydown', onEscape);
  key('Escape');
  document.removeEventListener('keydown', onEscape);
  expect(onEscape).not.toHaveBeenCalled();
  expect(onPick).not.toHaveBeenCalled();
  expect(picker.selectedRef).toBe(models[1].ref);
  expect(button.getAttribute('aria-expanded')).toBe('false');
});

test('handles no matches and clears search on reopen', () => {
  picker.open();
  search('missing-model');
  expect(picker.count.textContent).toBe('No matching models');
  key('Enter');
  key('ArrowDown');
  expect(onPick).not.toHaveBeenCalled();
  picker.close();
  picker.open();
  expect(picker.list.children).toHaveLength(3);
  expect(picker.input.value).toBe('');
});

test('selects with the mouse and dismisses on outside click or Tab', () => {
  picker.open();
  picker.list.children[2].click();
  expect(onPick).toHaveBeenCalledWith(models[2].ref);
  picker.open();
  document.getElementById('outside').dispatchEvent(new Event('pointerdown', { bubbles: true }));
  expect(picker.pop.hidden).toBe(true);
  picker.open();
  key('Tab');
  expect(picker.pop.hidden).toBe(true);
});

test('refreshes open results, disables empty lists, and renders labels as text', () => {
  picker.open();
  search('qwen');
  picker.render([models[0]], models[0].ref);
  expect(picker.list.children).toHaveLength(1);
  picker.render([], null);
  expect(button.disabled).toBe(true);
  expect(picker.pop.hidden).toBe(true);
  picker.render([{ ref: 'safe', label: '<img src=x onerror=alert(1)>' }], 'safe');
  picker.open();
  expect(picker.list.querySelector('img')).toBeNull();
  expect(picker.list.textContent).toContain('<img');
});

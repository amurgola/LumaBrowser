import Dom from '../../dom/Dom.js';
import SchemaField from './SchemaField.js';

export default class TextInputField extends SchemaField {
  static get types() {
    return ['text', 'number'];
  }

  render(wrap, { field, model, api }) {
    const input = TextInputField._input(field, model);
    if (field.browse === 'directory') wrap.appendChild(TextInputField._browseRow(input, field, model, api));
    else wrap.appendChild(input);
  }

  static _input(field, model) {
    const input = Dom.el('input');
    const isNumber = field.type === 'number';
    input.type = isNumber ? 'number' : 'text';
    if (isNumber) TextInputField._applyBounds(input, field);
    if (field.placeholder) input.placeholder = field.placeholder;
    if (model[field.key] != null) input.value = model[field.key];
    input.addEventListener('input', () => {
      model[field.key] = isNumber ? (input.value === '' ? null : Number(input.value)) : input.value;
    });
    return input;
  }

  static _applyBounds(input, field) {
    if (field.min != null) input.min = field.min;
    if (field.max != null) input.max = field.max;
    if (field.step != null) input.step = field.step;
  }

  static _browseRow(input, field, model, api) {
    const row = Dom.el('div');
    row.style.cssText = 'display:flex; gap:8px; align-items:center;';
    input.style.flex = '1';
    const browse = Dom.el('button', 'luma-btn', 'Browse…');
    browse.type = 'button';
    browse.style.whiteSpace = 'nowrap';
    browse.addEventListener('click', () => TextInputField._pick(input, field, model, api));
    row.appendChild(input);
    row.appendChild(browse);
    return row;
  }

  static async _pick(input, field, model, api) {
    const picker = (api && api.pickDirectory) || (window.llmDiagAPI && window.llmDiagAPI.pickDirectory);
    if (!picker) return;
    try {
      const r = await picker({ title: field.label || 'Choose a folder' });
      if (r && r.success && !r.canceled && r.dir) {
        input.value = r.dir;
        model[field.key] = r.dir;
      }
    } catch (_) {}
  }
}

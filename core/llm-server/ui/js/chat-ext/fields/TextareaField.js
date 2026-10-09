import Dom from '../../dom/Dom.js';
import SchemaField from './SchemaField.js';

export default class TextareaField extends SchemaField {
  static get types() {
    return ['textarea'];
  }

  render(wrap, { field, model }) {
    const textarea = Dom.el('textarea');
    if (field.placeholder) textarea.placeholder = field.placeholder;
    if (model[field.key] != null) textarea.value = model[field.key];
    textarea.addEventListener('input', () => { model[field.key] = textarea.value; });
    wrap.appendChild(textarea);
  }
}

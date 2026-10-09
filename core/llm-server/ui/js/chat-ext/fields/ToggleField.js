import Dom from '../../dom/Dom.js';
import SchemaField from './SchemaField.js';

export default class ToggleField extends SchemaField {
  static get types() {
    return ['toggle'];
  }

  get labelled() {
    return false;
  }

  render(wrap, { field, model }) {
    const label = Dom.el('label', 'luma-check');
    const box = Dom.el('input');
    box.type = 'checkbox';
    box.checked = !!model[field.key];
    box.addEventListener('change', () => { model[field.key] = box.checked; });
    label.appendChild(box);
    label.appendChild(Dom.el('span', null, field.label || field.key));
    wrap.appendChild(label);
  }
}

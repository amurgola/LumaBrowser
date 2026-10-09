import Dom from '../../dom/Dom.js';
import SchemaField from './SchemaField.js';

export default class SelectField extends SchemaField {
  static get types() {
    return ['select'];
  }

  render(wrap, { field, model }) {
    const select = Dom.el('select');
    for (const opt of (field.options || [])) select.appendChild(SelectField._option(opt, model[field.key]));
    if (model[field.key] === undefined && field.options && field.options[0]) model[field.key] = field.options[0].value;
    select.addEventListener('change', () => { model[field.key] = select.value; });
    wrap.appendChild(select);
  }

  static _option(opt, current) {
    const option = Dom.el('option');
    option.value = opt.value;
    option.textContent = opt.label || opt.value;
    if (current === opt.value) option.selected = true;
    return option;
  }
}

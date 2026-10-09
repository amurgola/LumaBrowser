import Dom from '../../dom/Dom.js';
import SchemaField from './SchemaField.js';

export default class GroupField extends SchemaField {
  static get types() {
    return ['group'];
  }

  render(wrap, { field, model, api, rootModel, renderer }) {
    wrap.className = 'cm-xgroup';
    wrap.innerHTML = '';
    wrap.appendChild(Dom.el('div', 'cm-xgroup-title', field.label || field.key));
    model[field.key] = model[field.key] || {};
    const nested = model[field.key];
    for (const sub of (field.fields || [])) wrap.appendChild(renderer.render(sub, nested, api, nested, rootModel));
  }
}

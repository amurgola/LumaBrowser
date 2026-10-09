import Dom from '../dom/Dom.js';
import AssistField from './AssistField.js';
import ToggleField from './fields/ToggleField.js';
import ButtonField from './fields/ButtonField.js';
import TextInputField from './fields/TextInputField.js';
import TextareaField from './fields/TextareaField.js';
import SelectField from './fields/SelectField.js';
import GroupField from './fields/GroupField.js';
import ImageField from './fields/ImageField.js';
import CharArtField from './fields/CharArtField.js';
import RepeaterField from './fields/RepeaterField.js';

export default class SchemaFieldRenderer {
  static FIELD_CLASSES = [ToggleField, ButtonField, TextInputField, TextareaField, SelectField, GroupField, ImageField,
    CharArtField, RepeaterField];

  static ASSIST_TYPES = ['text', 'textarea'];

  constructor(fieldClasses = SchemaFieldRenderer.FIELD_CLASSES) {
    this._byType = new Map();
    for (const FieldClass of fieldClasses) {
      const instance = new FieldClass();
      for (const type of FieldClass.types) this._byType.set(type, instance);
    }
  }

  render(field, model, api, siblingModel, rootModel) {
    const spec = { field, model, api, siblingModel, rootModel: rootModel || model, renderer: this };
    const wrap = Dom.el('div', 'luma-field');
    if (field.half) wrap.classList.add('cm-x-half');
    const handler = this._byType.get(field.type) || null;
    if (handler && !handler.labelled) { handler.render(wrap, spec); return wrap; }
    SchemaFieldRenderer._appendLabel(wrap, field);
    if (handler) handler.render(wrap, spec);
    SchemaFieldRenderer._attachAssist(wrap, spec);
    return wrap;
  }

  static _appendLabel(wrap, field) {
    const reqMark = field.required ? ' *' : '';
    wrap.appendChild(Dom.el('label', null, '<span class="cm-xlabel">' + (field.label || field.key) + reqMark + '</span>'));
    if (field.hint) wrap.appendChild(Dom.el('div', 'cm-xhint', field.hint));
  }

  static _attachAssist(wrap, { field, model, api, rootModel, siblingModel }) {
    if (!SchemaFieldRenderer.ASSIST_TYPES.includes(field.type) || typeof field.assist !== 'function') return;
    const input = wrap.querySelector('textarea, input:not([type="file"])');
    if (input) new AssistField(wrap, input, field, { api, model, rootModel, siblingModel }).attach();
  }
}

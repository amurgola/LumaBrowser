import Dom from '../dom/Dom.js';
import ChatExtStyles from './ChatExtStyles.js';
import SchemaFieldRenderer from './SchemaFieldRenderer.js';

export default class SchemaCard {
  static isVisible(field, model) {
    const cond = field && field.showIf;
    if (!cond || !cond.key) return true;
    const value = model[cond.key];
    if (Array.isArray(cond.in)) return cond.in.includes(value);
    if ('equals' in cond) return value === cond.equals;
    return !!value;
  }

  static missingFields(schema, model) {
    return (schema.fields || []).filter(
      (f) => f.required && SchemaCard.isVisible(f, model) && (model[f.key] == null || model[f.key] === ''),
    );
  }

  constructor(renderer = new SchemaFieldRenderer()) {
    this._renderer = renderer;
  }

  build(schema, opts, close) {
    ChatExtStyles.ensure();
    const api = opts.api || window.llmDiagAPI;
    const model = opts.initial ? JSON.parse(JSON.stringify(opts.initial)) : {};
    const card = Dom.el('div', 'luma-modal cm-schema');
    card.appendChild(SchemaCard._head(schema));
    card.appendChild(this._body(schema, model, api));
    const errLine = Dom.el('div', 'luma-form-err');
    errLine.style.padding = '0 24px 6px';
    card.appendChild(errLine);
    card.appendChild(SchemaCard._foot(schema, model, errLine, close));
    return card;
  }

  static _head(schema) {
    const head = Dom.el('div', 'luma-modal-head');
    head.appendChild(Dom.el('div', 'luma-modal-title', schema.title || 'Setup'));
    if (schema.subtitle) head.appendChild(Dom.el('div', 'luma-modal-sub', schema.subtitle));
    return head;
  }

  _body(schema, model, api) {
    const body = Dom.el('div', 'luma-modal-body');
    const rendered = (schema.fields || []).map((field) => {
      const wrap = this._renderer.render(field, model, api, model);
      body.appendChild(wrap);
      return { field, wrap };
    });
    const refresh = () => {
      for (const r of rendered) r.wrap.style.display = SchemaCard.isVisible(r.field, model) ? '' : 'none';
    };
    body.addEventListener('input', refresh);
    body.addEventListener('change', refresh);
    refresh();
    return body;
  }

  static _foot(schema, model, errLine, close) {
    const foot = Dom.el('div', 'luma-modal-foot');
    const cancel = Dom.el('button', 'luma-btn', 'Cancel');
    cancel.type = 'button';
    const submit = Dom.el('button', 'luma-btn primary', schema.submitLabel || 'Create');
    submit.type = 'button';
    cancel.addEventListener('click', () => close(null));
    submit.addEventListener('click', () => {
      const missing = SchemaCard.missingFields(schema, model);
      if (!missing.length) { close(model); return; }
      errLine.textContent = 'Please fill in: ' + missing.map((f) => f.label || f.key).join(', ');
    });
    foot.appendChild(cancel);
    foot.appendChild(submit);
    return foot;
  }
}

import Dom from '../../dom/Dom.js';
import HtmlEscaper from '../../format/HtmlEscaper.js';
import SchemaField from './SchemaField.js';
import AssistField from '../AssistField.js';

export default class RepeaterField extends SchemaField {
  static get types() {
    return ['repeater'];
  }

  render(wrap, spec) {
    const { field, model } = spec;
    model[field.key] = Array.isArray(model[field.key]) ? model[field.key] : [];
    const list = Dom.el('div', 'cm-xrep-list');
    const redraw = () => RepeaterField._renderItems(list, spec, redraw);
    redraw();
    wrap.classList.add('cm-xrep');
    const actions = Dom.el('div', 'cm-xrep-actions');
    actions.appendChild(RepeaterField._addButton(field, model, redraw));
    wrap.appendChild(list);
    if (typeof field.assistAdd !== 'function') { wrap.appendChild(actions); return; }
    const status = Dom.el('div', 'cm-xassist-status');
    actions.appendChild(RepeaterField._assistAddButton(spec, status, redraw));
    wrap.appendChild(actions);
    wrap.appendChild(status);
  }

  static _renderItems(list, { field, model, api, rootModel, renderer }, redraw) {
    list.innerHTML = '';
    model[field.key].forEach((item, idx) => {
      const itemEl = Dom.el('div', 'cm-xrep-item');
      const remove = Dom.el('button', 'cm-xrep-rm', 'Remove');
      remove.type = 'button';
      remove.addEventListener('click', () => { model[field.key].splice(idx, 1); redraw(); });
      itemEl.appendChild(remove);
      itemEl.appendChild(Dom.el('div', 'cm-xgroup-title', (field.itemLabel || 'Item') + ' ' + (idx + 1)));
      for (const sub of (field.fields || [])) itemEl.appendChild(renderer.render(sub, item, api, item, rootModel));
      list.appendChild(itemEl);
    });
  }

  static _addButton(field, model, redraw) {
    const add = Dom.el('button', 'cm-xrep-add', '+ Add ' + (field.itemLabel || 'item'));
    add.type = 'button';
    add.addEventListener('click', () => { model[field.key].push({}); redraw(); });
    return add;
  }

  static _assistAddButton(spec, status, redraw) {
    const { field } = spec;
    const label = field.assistAddLabel || ('Add ' + (field.itemLabel || 'item') + ' with AI');
    const button = Dom.el('button', 'cm-xrep-add cm-xassist-add', AssistField.ASSIST_ICON + '<span>' + HtmlEscaper.escape(label) + '</span>');
    button.type = 'button';
    if (field.assistTitle) button.title = field.assistTitle;
    button.addEventListener('click', () => RepeaterField._assistAdd(button, status, spec, redraw));
    return button;
  }

  static async _assistAdd(button, status, { field, model, api, rootModel }, redraw) {
    if (button.disabled) return;
    button.disabled = true;
    button.classList.add('busy');
    status.textContent = '';
    try {
      const item = await field.assistAdd({
        api, items: model[field.key], rootModel,
        setStatus: (msg) => { status.textContent = msg == null ? '' : String(msg); },
      });
      if (item && typeof item === 'object') {
        model[field.key].push(item);
        redraw();
        status.textContent = '';
      }
    } catch (e) {
      status.textContent = (e && e.message) || 'failed';
    } finally {
      button.disabled = false;
      button.classList.remove('busy');
    }
  }
}

import Dom from '../../dom/Dom.js';
import SchemaField from './SchemaField.js';

export default class ButtonField extends SchemaField {
  static get types() {
    return ['button'];
  }

  get labelled() {
    return false;
  }

  render(wrap, { field, model, api, rootModel }) {
    const button = Dom.el('button', 'luma-btn', field.label || 'Run');
    button.type = 'button';
    const status = Dom.el('div', 'cm-xbtn-status');
    const setStatus = (m) => { status.textContent = m == null ? '' : String(m); };
    button.addEventListener('click', () => ButtonField._run(button, field, { api, model, rootModel, setStatus }));
    if (field.hint) wrap.appendChild(Dom.el('div', 'cm-xhint', field.hint));
    wrap.appendChild(button);
    wrap.appendChild(status);
  }

  static async _run(button, field, args) {
    if (typeof field.onClick !== 'function') return;
    const label = button.textContent;
    button.disabled = true;
    try {
      await field.onClick(args);
    } catch (e) {
      args.setStatus((e && e.message) || 'failed');
    } finally {
      button.disabled = false;
      button.textContent = label;
    }
  }
}

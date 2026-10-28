import Dom from '../../dom/Dom.js';
import SchemaField from './SchemaField.js';

export default class SectionField extends SchemaField {
  static get types() {
    return ['section'];
  }

  render(wrap, { field, model, api, rootModel, renderer }) {
    wrap.className = 'cm-xsection' + (field.collapsed ? ' is-collapsed' : '');
    wrap.innerHTML = '';
    const title = Dom.el('button', 'cm-xsection-title', '<span class="cm-xsection-caret"></span>' + (field.label || field.key));
    title.type = 'button';
    title.setAttribute('aria-expanded', field.collapsed ? 'false' : 'true');
    title.addEventListener('click', (e) => {
      e.preventDefault();
      const collapsed = wrap.classList.toggle('is-collapsed');
      title.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
    });
    wrap.appendChild(title);
    if (field.hint) wrap.appendChild(Dom.el('div', 'cm-xhint', field.hint));
    const body = Dom.el('div', 'cm-xsection-body');
    for (const sub of (field.fields || [])) body.appendChild(renderer.render(sub, model, api, model, rootModel));
    wrap.appendChild(body);
  }
}

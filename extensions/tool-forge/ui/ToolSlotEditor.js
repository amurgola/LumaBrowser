import Dom from '../../../core/llm-server/ui/js/dom/Dom.js';

export default class ToolSlotEditor {
  static NEW_SLOT = { key: '', label: '', description: '', required: false, secret: false };

  constructor(container, slots) {
    this._container = container;
    this._slots = slots;
  }

  add() {
    this._slots.push({ ...ToolSlotEditor.NEW_SLOT });
    this.render();
  }

  render() {
    this._container.innerHTML = '';
    this._slots.forEach((slot, i) => this._container.appendChild(this._row(slot, i)));
    if (!this._slots.length) this._container.appendChild(Dom.el('div', 'tf-hint', 'No config slots.'));
  }

  _row(slot, i) {
    const row = Dom.el('div', 'tf-slot-row');
    row.appendChild(ToolSlotEditor._input('key', slot.key, (v) => { slot.key = v.trim(); }));
    row.appendChild(ToolSlotEditor._input('label', slot.label, (v) => { slot.label = v; }));
    row.appendChild(ToolSlotEditor._check('required', slot.required, (v) => { slot.required = v; }));
    row.appendChild(ToolSlotEditor._check('secret', slot.secret, (v) => { slot.secret = v; }));
    const del = Dom.el('button', 'luma-btn link', '✕');
    del.addEventListener('click', () => { this._slots.splice(i, 1); this.render(); });
    row.appendChild(del);
    return row;
  }

  static _input(placeholder, value, onInput) {
    const input = document.createElement('input');
    input.className = 'luma-input';
    input.placeholder = placeholder;
    input.value = value || '';
    input.addEventListener('input', () => onInput(input.value));
    return input;
  }

  static _check(labelText, checked, onChange) {
    const wrap = Dom.el('label', 'tf-check');
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = !!checked;
    cb.addEventListener('change', () => onChange(cb.checked));
    wrap.appendChild(cb);
    wrap.appendChild(document.createTextNode(' ' + labelText));
    return wrap;
  }
}

import Dom from '../../../core/llm-server/ui/js/dom/Dom.js';
import HtmlEscaper from '../../../core/llm-server/ui/js/format/HtmlEscaper.js';
import ToolListView from './ToolListView.js';
import ToolNotice from './ToolNotice.js';
import ToolSlotEditor from './ToolSlotEditor.js';

export default class ToolEditView {
  static EMPTY_SCHEMA = { type: 'object', properties: {} };

  static render(el, view, on) {
    const t = view.tool;
    el.appendChild(ToolEditView._head(t, on));
    ToolNotice.render(el, view.notice, on.dismiss);
    if ((t.configSlots || []).length) el.appendChild(ToolEditView._settings(t, on));
    el.appendChild(ToolEditView._codeSection());
    el.appendChild(ToolEditView._definition(t, view.slots));
    el.appendChild(ToolEditView._actionBar(view.canPublish, on));
  }

  static collectPatch(el, slots, code) {
    const value = (name) => el.querySelector(`[name=${name}]`).value;
    const schemaText = value('tf-schema').trim();
    let inputSchema;
    try {
      inputSchema = schemaText ? JSON.parse(schemaText) : { ...ToolEditView.EMPTY_SCHEMA, properties: {} };
    } catch (e) {
      throw new Error('Input schema is not valid JSON: ' + e.message);
    }
    return {
      label: value('tf-label').trim(),
      description: value('tf-description').trim(),
      allowedHosts: value('tf-hosts').split(',').map((h) => h.trim()).filter(Boolean),
      inputSchema,
      configSlots: slots,
      code,
    };
  }

  static collectSettings(el) {
    const values = {};
    el.querySelectorAll('input[data-slot]').forEach((inp) => {
      if (inp.value !== '') values[inp.dataset.slot] = inp.value;
    });
    return values;
  }

  static _head(t, on) {
    const head = Dom.el('div', 'luma-head tf-edit-head');
    const back = Dom.el('button', 'luma-btn link', '← My Tools');
    back.addEventListener('click', on.back);
    head.appendChild(back);
    head.appendChild(Dom.el('div', 'tf-edit-title', HtmlEscaper.escape(t.name) + ' ' + ToolListView.statusChip(t.status)));
    return head;
  }

  static _settings(t, on) {
    const sec = Dom.el('section', 'tf-section');
    sec.appendChild(Dom.el('div', 'luma-section-label', 'Settings'));
    const form = Dom.el('div', 'tf-settings');
    for (const slot of t.configSlots) form.appendChild(ToolEditView._settingField(slot, ToolEditView._slotStatus(t, slot)));
    const save = Dom.el('button', 'luma-btn', 'Save settings');
    save.addEventListener('click', on.saveSettings);
    form.appendChild(save);
    sec.appendChild(form);
    return sec;
  }

  static _slotStatus(t, slot) {
    return ((t.config && t.config.slots) || []).find((s) => s.key === slot.key) || {};
  }

  static _settingField(slot, status) {
    const field = Dom.el('label', 'luma-field');
    field.appendChild(Dom.el('span', null, HtmlEscaper.escape(slot.label || slot.key) + (slot.required ? ' *' : '')
      + (slot.secret ? ' <span class="tf-hint">(secret)</span>' : '')));
    if (slot.description) field.appendChild(Dom.el('span', null, '<small>' + HtmlEscaper.escape(slot.description) + '</small>'));
    const inp = document.createElement('input');
    inp.className = 'luma-input';
    inp.type = slot.secret ? 'password' : 'text';
    inp.dataset.slot = slot.key;
    inp.placeholder = ToolEditView._placeholder(slot, status);
    field.appendChild(inp);
    return field;
  }

  static _placeholder(slot, status) {
    if (!status.configured) return 'Not set';
    return slot.secret ? '•••••••• (set)' : '(set)';
  }

  static _codeSection() {
    const sec = Dom.el('section', 'tf-section');
    sec.appendChild(Dom.el('div', 'luma-section-label', 'Code'));
    sec.appendChild(Dom.el('div', 'tf-hint',
      'async function run(args, ctx): use ctx.fetch, ctx.luma, and ctx.config. Type "ctx." for suggestions.'));
    const host = Dom.el('div', 'tf-code-editor');
    host.setAttribute('data-tf-editor', '');
    sec.appendChild(host);
    return sec;
  }

  static _definition(t, slots) {
    const details = document.createElement('details');
    details.className = 'tf-section tf-definition';
    const sum = document.createElement('summary');
    sum.textContent = 'Definition (name, description, hosts, inputs, config slots)';
    details.appendChild(sum);
    details.appendChild(ToolEditView._field('Label', 'tf-label', 'input', t.label || ''));
    details.appendChild(ToolEditView._field('Description', 'tf-description', 'textarea', t.description || ''));
    details.appendChild(ToolEditView._field('Allowed hosts (comma-separated)', 'tf-hosts', 'input', (t.allowedHosts || []).join(', ')));
    details.appendChild(ToolEditView._slots(slots));
    details.appendChild(ToolEditView._field('Input schema (JSON)', 'tf-schema', 'textarea',
      JSON.stringify(t.inputSchema || ToolEditView.EMPTY_SCHEMA, null, 2)));
    return details;
  }

  static _slots(slots) {
    const wrap = Dom.el('div', 'tf-slots');
    wrap.appendChild(Dom.el('div', 'luma-field-label', 'Config slots'));
    const list = Dom.el('div', 'tf-slots-list');
    list.setAttribute('data-tf-slots', '');
    wrap.appendChild(list);
    const editor = new ToolSlotEditor(list, slots);
    const add = Dom.el('button', 'luma-btn link', '+ Add config slot');
    add.addEventListener('click', () => editor.add());
    wrap.appendChild(add);
    editor.render();
    return wrap;
  }

  static _field(labelText, name, kind, value) {
    const wrap = Dom.el('label', 'luma-field');
    wrap.appendChild(Dom.el('span', null, HtmlEscaper.escape(labelText)));
    const input = document.createElement(kind === 'textarea' ? 'textarea' : 'input');
    input.className = kind === 'textarea' ? 'luma-input tf-textarea' : 'luma-input';
    input.setAttribute('name', name);
    input.value = value;
    wrap.appendChild(input);
    return wrap;
  }

  static _actionBar(canPublish, on) {
    const bar = Dom.el('section', 'tf-section tf-actionbar');
    const testArgs = document.createElement('textarea');
    testArgs.className = 'luma-input tf-testargs';
    testArgs.setAttribute('name', 'tf-testargs');
    testArgs.placeholder = 'Test args as JSON, e.g. { "card_name": "Black Lotus" }';
    bar.appendChild(testArgs);
    const btns = Dom.el('div', 'tf-actionbar-btns');
    btns.appendChild(ToolEditView._button('luma-btn', 'Test', on.test));
    btns.appendChild(ToolEditView._button('luma-btn', 'Save draft', on.save));
    const pub = ToolEditView._button('luma-btn primary', 'Publish', on.publish);
    pub.disabled = !canPublish;
    pub.title = canPublish ? '' : 'Run a passing Test on the current code first.';
    btns.appendChild(pub);
    bar.appendChild(btns);
    return bar;
  }

  static _button(cls, label, onClick) {
    const btn = Dom.el('button', cls, label);
    btn.addEventListener('click', onClick);
    return btn;
  }
}

import HtmlEscaper from '../../../llm-server/ui/js/format/HtmlEscaper.js';

export default class ActionPromptModal {
  static PICK_DIRECTORY_CHANNEL = 'core.llmServer.pickDirectory';

  static open(prompt) {
    const spec = prompt || {};
    const fields = Array.isArray(spec.fields) ? spec.fields : [];
    return new Promise((resolve) => {
      const back = ActionPromptModal._overlay(spec, fields);
      const box = back.firstChild;
      document.body.appendChild(back);
      const close = (v) => { back.remove(); resolve(v); };
      box.querySelector('#ext-action-cancel').addEventListener('click', () => close(null));
      back.addEventListener('click', (e) => { if (e.target === back) close(null); });
      ActionPromptModal._wireBrowse(box, fields);
      box.querySelector('#ext-action-submit').addEventListener('click', () => ActionPromptModal._submit(box, fields, close));
      const firstInput = box.querySelector('textarea, input');
      if (firstInput) setTimeout(() => firstInput.focus(), 0);
    });
  }

  static _overlay(spec, fields) {
    const esc = HtmlEscaper.escape;
    const back = document.createElement('div');
    back.className = 'luma-modal-overlay';
    back.style.cssText = 'position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;';
    const box = document.createElement('div');
    box.className = 'luma-modal';
    box.style.cssText = 'width:min(520px,92vw);';
    box.innerHTML = `
        <div class="luma-modal-head">
          ${spec.title ? `<div class="luma-modal-title">${esc(spec.title)}</div>` : ''}
          ${spec.subtitle ? `<div class="luma-modal-sub">${esc(spec.subtitle)}</div>` : ''}
        </div>
        <div class="luma-modal-body luma-form">${fields.map((f, i) => ActionPromptModal._fieldHtml(f, i)).join('')}</div>
        <div class="luma-modal-foot" style="display:flex;justify-content:flex-end;gap:8px;">
          <button class="luma-btn" id="ext-action-cancel">Cancel</button>
          <button class="luma-btn primary" id="ext-action-submit">${esc(spec.submitLabel || 'Start')}</button>
        </div>`;
    back.appendChild(box);
    return back;
  }

  static _fieldHtml(f, i) {
    const esc = HtmlEscaper.escape;
    const id = `ext-action-f${i}`;
    const ph = esc(f.placeholder || '');
    let ctrl;
    if (f.type === 'textarea') {
      ctrl = `<textarea id="${id}" class="luma-field-textarea" rows="${Number(f.rows) || 4}" style="width:100%;box-sizing:border-box;" placeholder="${ph}"></textarea>`;
    } else if (f.browse === 'directory') {
      ctrl = `<div style="display:flex;gap:8px;align-items:center;">`
        + `<input id="${id}" type="text" class="luma-field-input" style="flex:1;box-sizing:border-box;" placeholder="${ph}" />`
        + `<button type="button" id="${id}-browse" class="luma-btn" style="white-space:nowrap;">Browse...</button></div>`;
    } else {
      ctrl = `<input id="${id}" type="text" class="luma-field-input" style="width:100%;box-sizing:border-box;" placeholder="${ph}" />`;
    }
    return `<div class="luma-field"><label class="luma-field-label" for="${id}">${esc(f.label || f.key)}</label>${ctrl}</div>`;
  }

  static _wireBrowse(box, fields) {
    fields.forEach((field, i) => {
      if (field.browse !== 'directory') return;
      const browseBtn = box.querySelector(`#ext-action-f${i}-browse`);
      const input = box.querySelector(`#ext-action-f${i}`);
      if (!browseBtn || !input) return;
      browseBtn.addEventListener('click', async () => {
        try {
          const r = await window.ipcBridge.invoke(ActionPromptModal.PICK_DIRECTORY_CHANNEL, { title: field.label || 'Choose a folder' });
          if (r && r.success && !r.canceled && r.dir) input.value = r.dir;
        } catch (_) {}
      });
    });
  }

  static _submit(box, fields, close) {
    const out = {};
    for (let i = 0; i < fields.length; i++) {
      const el = box.querySelector(`#ext-action-f${i}`);
      const val = el ? el.value.trim() : '';
      if (fields[i].required && !val) { if (el) el.focus(); return; }
      out[fields[i].key] = val;
    }
    close(out);
  }
}

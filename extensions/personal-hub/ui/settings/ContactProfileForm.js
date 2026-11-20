import WidgetDom from '../widgets/WidgetDom.js';

export default class ContactProfileForm {
  static LABEL_WIDTH = '132px';

  static html(contact, kinds, contexts = []) {
    const esc = WidgetDom.esc;
    const profile = contact.profile || {};
    return `
      <div class="ext-hub-profile" data-profile="${esc(contact.id)}" data-kind="${esc(contact.kind)}" style="margin:8px 0 4px 26px;padding:10px 12px;border:1px solid var(--border-soft);border-radius:var(--radius-md)">
        <div class="ext-form-row-inline" style="align-items:center">
          <span class="luma-segmented" role="group" aria-label="Kind of contact">${kinds.map((k) => `
            <button type="button" data-action="kind" data-kind="${esc(k.kind)}" class="${k.kind === contact.kind ? 'active' : ''}" aria-pressed="${k.kind === contact.kind}">${esc(k.label)}</button>`).join('')}
          </span>
          <span class="luma-field-help" style="margin:0">A business, an organisation or anyone not placed yet is general.</span>
        </div>
        ${ContactProfileForm._context(contact, contexts)}
        <div data-role="fields">${ContactProfileForm._fields(ContactProfileForm._kind(kinds, contact.kind), profile.fields || {})}</div>
        <div data-role="details">${(profile.details || []).map((d) => ContactProfileForm._detailRow(d)).join('')}</div>
        <div class="ext-mt-8"><button type="button" class="luma-btn luma-btn--sm" data-action="add-detail" title="A phone number, an address, where they work: anything with a label">Add a detail</button></div>
        <textarea class="luma-field-textarea ext-mt-8" data-profile-notes placeholder="Anything the assistant should know: how you get on, what they usually want, how to answer them" aria-label="Notes for the assistant">${esc(profile.notes || '')}</textarea>
        ${ContactProfileForm._suggested(profile.suggested || [])}
        <div class="ext-form-row-inline ext-mt-8">
          <button type="button" class="luma-btn luma-btn--sm primary" data-action="save-profile">Save</button>
          <button type="button" class="luma-btn luma-btn--sm" data-action="learn" title="Have the Hub's model read what this contact sent you and propose details. Nothing is saved until you accept it.">Suggest from conversations</button>
        </div>
      </div>`;
  }

  static setKind(root, kind, kinds) {
    root.dataset.kind = kind;
    for (const button of root.querySelectorAll('button[data-action="kind"]')) {
      const on = button.dataset.kind === kind;
      button.classList.toggle('active', on);
      button.setAttribute('aria-pressed', String(on));
    }
    root.querySelector('[data-role="fields"]').innerHTML = ContactProfileForm._fields(ContactProfileForm._kind(kinds, kind), {});
  }

  static addDetail(root) {
    const holder = root.querySelector('[data-role="details"]');
    holder.insertAdjacentHTML('beforeend', ContactProfileForm._detailRow({ label: '', value: '' }));
    holder.lastElementChild.querySelector('[data-detail-label]').focus();
  }

  static read(root) {
    const typed = ContactProfileForm.capture(root);
    const fields = {};
    for (const [key, value] of Object.entries(typed.fields)) fields[key] = value.trim();
    const details = typed.details.map((d) => ({ label: d.label.trim(), value: d.value.trim() })).filter((d) => d.label && d.value);
    const read = { kind: typed.kind, fields, details, notes: typed.notes.trim() };
    return typed.contextId == null ? read : { ...read, contextId: typed.contextId };
  }

  static capture(root) {
    const fields = {};
    for (const input of root.querySelectorAll('[data-profile-field]')) fields[input.dataset.profileField] = input.value;
    const details = [...root.querySelectorAll('[data-detail]')]
      .map((row) => ({ label: row.querySelector('[data-detail-label]').value, value: row.querySelector('[data-detail-value]').value }));
    const context = root.querySelector('[data-profile-context]');
    return { kind: root.dataset.kind, fields, details, notes: root.querySelector('[data-profile-notes]').value, contextId: context ? context.value : null };
  }

  static restore(root, typed, kinds) {
    if (root.dataset.kind !== typed.kind) ContactProfileForm.setKind(root, typed.kind, kinds);
    for (const input of root.querySelectorAll('[data-profile-field]')) {
      if (typed.fields[input.dataset.profileField] != null) input.value = typed.fields[input.dataset.profileField];
    }
    root.querySelector('[data-role="details"]').innerHTML = typed.details.map((d) => ContactProfileForm._detailRow(d)).join('');
    root.querySelector('[data-profile-notes]').value = typed.notes;
    const context = root.querySelector('[data-profile-context]');
    if (context && typed.contextId != null) context.value = typed.contextId;
  }

  static _context(contact, contexts) {
    const esc = WidgetDom.esc;
    if (!contexts.length) return '';
    const implied = !contact.contextId && contact.homeContextId ? contexts.find((c) => c.id === contact.homeContextId) : null;
    const options = [{ id: '', name: implied ? `Not set (${implied.name}, from the relation)` : 'Not set' }, ...contexts];
    return `
        <label class="ext-form-row-inline ext-mt-8" style="align-items:center" title="Mail and direct messages from this contact are filed under this context, whichever account they arrive in">
          <span class="luma-field-label" style="margin:0;flex:0 0 ${ContactProfileForm.LABEL_WIDTH}">Belongs to</span>
          <select class="luma-field-select" data-profile-context aria-label="Context this contact belongs to">${options.map((c) => `<option value="${esc(c.id)}"${c.id === (contact.contextId || '') ? ' selected' : ''}>${esc(c.name)}</option>`).join('')}</select>
        </label>`;
  }

  static _kind(kinds, kind) {
    return kinds.find((k) => k.kind === kind) || kinds[0] || { fields: [] };
  }

  static _fields(kind, values) {
    return kind.fields.map((field) => `
      <label class="ext-form-row-inline ext-mt-8" style="align-items:center">
        <span class="luma-field-label" style="margin:0;flex:0 0 ${ContactProfileForm.LABEL_WIDTH}">${WidgetDom.esc(field.label)}</span>
        ${ContactProfileForm._control(field, values[field.key] || '')}
      </label>`).join('');
  }

  static _control(field, value) {
    const esc = WidgetDom.esc;
    if (field.type !== 'choice') {
      return `<input type="text" class="luma-field-input" data-profile-field="${esc(field.key)}" value="${esc(ContactProfileForm._shown(field, value))}" placeholder="${esc(field.hint || '')}">`;
    }
    const options = [{ value: '', label: 'Not set' }, ...field.options];
    return `<select class="luma-field-select" data-profile-field="${esc(field.key)}">${options.map((o) => `<option value="${esc(o.value)}"${o.value === value ? ' selected' : ''}>${esc(o.label)}</option>`).join('')}</select>`;
  }

  static _shown(field, value) {
    return field.type === 'birthday' ? String(value).replace(/^--/, '') : value;
  }

  static _detailRow(detail) {
    const esc = WidgetDom.esc;
    return `
      <div class="ext-form-row-inline ext-mt-8" data-detail style="align-items:center">
        <input type="text" class="luma-field-input" data-detail-label value="${esc(detail.label)}" placeholder="Phone, address, works at" aria-label="What this detail is" style="flex:0 0 ${ContactProfileForm.LABEL_WIDTH}">
        <input type="text" class="luma-field-input" data-detail-value value="${esc(detail.value)}" aria-label="The detail">
        <button type="button" class="luma-btn luma-btn--sm" data-action="remove-detail">Remove</button>
      </div>`;
  }

  static _suggested(suggested) {
    const esc = WidgetDom.esc;
    if (!suggested.length) return '';
    return `
      <div class="ext-mt-8" data-role="suggested">
        <div class="luma-field-help" style="margin:0">Suggested from conversations. Nothing here is kept unless you accept it.</div>${suggested.map((s) => `
        <div class="ext-form-row-inline ext-mt-8" data-suggestion="${esc(s.id)}" style="align-items:center">
          <span style="flex:1;min-width:0"><strong>${esc(s.label)}:</strong> ${esc(s.value)}${s.why ? ` <span class="luma-field-help" style="margin:0">(${esc(s.why)})</span>` : ''}</span>
          <button type="button" class="luma-btn luma-btn--sm" data-action="accept-suggestion">Accept</button>
          <button type="button" class="luma-btn luma-btn--sm" data-action="dismiss-suggestion">Dismiss</button>
        </div>`).join('')}
      </div>`;
  }
}

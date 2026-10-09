class FormFiller {
  static async fill(page, options = {}) {
    const { fields } = options;
    if (!Array.isArray(fields) || fields.length === 0) return { success: false, error: 'fields array is required' };
    return page.runEnvelope(FormFiller.script(fields));
  }

  static script(fields) {
    return `
(function() {
  try {
    const fields = ${JSON.stringify(fields)};
    const results = [];
    for (const field of fields) {
      let el = null;
      if (field.ref != null && Number.isFinite(Number(field.ref))) {
        // Element ref from observe_page: resolves the tagged node live.
        el = document.querySelector('[data-luma-ref="' + Math.trunc(Number(field.ref)) + '"]');
        if (!el) { results.push({ field: 'ref ' + field.ref, success: false, error: 'ref not on this page; call observe_page again' }); continue; }
      } else if (field.selector) {
        el = document.querySelector(field.selector);
      } else if (field.label) {
        const labels = document.querySelectorAll('label');
        for (const lbl of labels) {
          if (lbl.textContent.trim().includes(field.label)) {
            if (lbl.htmlFor) el = document.getElementById(lbl.htmlFor);
            if (!el) el = lbl.querySelector('input, textarea, select');
            if (!el) {
              let sibling = lbl.nextElementSibling;
              while (sibling && !['INPUT','TEXTAREA','SELECT'].includes(sibling.tagName)) {
                sibling = sibling.nextElementSibling;
              }
              el = sibling || lbl.parentElement.querySelector('input, textarea, select');
            }
            if (el) break;
          }
        }
      }
      const fieldId = field.selector || field.label || (field.ref != null ? 'ref ' + field.ref : 'field');
      if (!el) { results.push({ field: fieldId, success: false, error: 'Element not found' }); continue; }
      const tag = el.tagName.toLowerCase();
      if (tag === 'select') {
        const options = Array.from(el.options);
        const match = options.find(o => o.value === field.value || o.textContent.trim() === field.value);
        if (match) el.selectedIndex = match.index; else el.value = field.value;
      } else {
        const proto = tag === 'textarea' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
        const nativeSetter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
        if (nativeSetter) nativeSetter.call(el, field.value);
        else el.value = field.value;
        el.dispatchEvent(new Event('input', { bubbles: true }));
      }
      el.dispatchEvent(new Event('change', { bubbles: true }));
      results.push({ field: fieldId, success: true });
    }
    return { success: true, results };
  } catch (error) { return { success: false, error: error.message }; }
})();`.trim();
  }
}

module.exports = FormFiller;

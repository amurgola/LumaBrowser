const SelectorKit = require('../extraction/SelectorKit');

class InteractableElements {
  static DEFAULT_LIMIT = 80;
  static MAX_LIMIT = 200;

  static async list(page, options = {}) {
    const limit = Math.max(1, Math.min(InteractableElements.MAX_LIMIT, options.limit || InteractableElements.DEFAULT_LIMIT));
    const result = await page.run(InteractableElements.script(limit, !!options.includeHidden));
    if (!result || result.success === false) {
      return { success: false, error: (result && result.error) || 'Failed to enumerate elements' };
    }
    return { success: true, data: result.elements, truncated: !!result.truncated };
  }

  static script(limit, includeHidden) {
    return `
(function() {
  try {${SelectorKit.HASHED_TOKEN_SRC}
    const LIMIT = ${limit};
    const INCLUDE_HIDDEN = ${JSON.stringify(includeHidden)};
    const query = 'button, a, input, select, textarea, [role], [tabindex], [aria-label], [data-role], [data-testid]';
    const nodes = Array.from(document.querySelectorAll(query));
    const out = [];
    const seen = new Set();
    for (const el of nodes) {
      if (out.length >= LIMIT) break;
      if (seen.has(el)) continue;
      seen.add(el);
      const rect = el.getBoundingClientRect();
      const visible = rect.width > 0 && rect.height > 0;
      if (!visible && !INCLUDE_HIDDEN) continue;
      let selector = null;
      if (el.id && !isHashedToken(el.id)) selector = '#' + CSS.escape(el.id);
      else if (el.dataset && el.dataset.testid) selector = '[data-testid="' + el.dataset.testid + '"]';
      else if (el.getAttribute && el.getAttribute('data-role')) selector = '[data-role="' + el.getAttribute('data-role') + '"]';
      else if (el.getAttribute && el.getAttribute('aria-label')) selector = el.tagName.toLowerCase() + '[aria-label="' + el.getAttribute('aria-label').replace(/"/g, '\\\\"') + '"]';
      else if (el.getAttribute && el.getAttribute('name')) selector = el.tagName.toLowerCase() + '[name="' + el.getAttribute('name') + '"]';
      else {
        // nth-of-type fallback: unique but brittle; used only when nothing better exists.
        let nth = 1;
        let sib = el.previousElementSibling;
        while (sib) { if (sib.tagName === el.tagName) nth++; sib = sib.previousElementSibling; }
        const parentSel = el.parentElement && el.parentElement.id && !isHashedToken(el.parentElement.id)
          ? '#' + CSS.escape(el.parentElement.id) + ' > ' : '';
        selector = parentSel + el.tagName.toLowerCase() + ':nth-of-type(' + nth + ')';
      }
      const text = (el.innerText || el.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 80);
      const entry = {
        selector: selector,
        tag: el.tagName.toLowerCase(),
        text: text || null,
        role: el.getAttribute ? (el.getAttribute('role') || null) : null,
        ariaLabel: el.getAttribute ? (el.getAttribute('aria-label') || null) : null,
        placeholder: el.getAttribute ? (el.getAttribute('placeholder') || null) : null,
        name: el.getAttribute ? (el.getAttribute('name') || null) : null,
        type: el.getAttribute ? (el.getAttribute('type') || null) : null,
        dataTestId: (el.dataset && el.dataset.testid) || null,
        dataRole: el.getAttribute ? (el.getAttribute('data-role') || null) : null,
        id: el.id || null,
        disabled: !!el.disabled,
        visible: visible,
      };
      // Drop empty attributes to shrink payload.
      for (const k of Object.keys(entry)) {
        if (entry[k] === null || entry[k] === false || entry[k] === '') delete entry[k];
      }
      out.push(entry);
    }
    return { success: true, elements: out, truncated: nodes.length > LIMIT };
  } catch (e) {
    return { success: false, error: e.message };
  }
})();`.trim();
  }
}

module.exports = InteractableElements;

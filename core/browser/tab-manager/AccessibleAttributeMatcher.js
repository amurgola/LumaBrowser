const SelectorKit = require('../extraction/SelectorKit');

class AccessibleAttributeMatcher {
  static NO_MATCH = 'No deterministic match';

  static async find(page, description) {
    if (!description || typeof description !== 'string') return { success: false, error: 'description is required' };
    const trimmed = description.trim();
    const result = await page.run(AccessibleAttributeMatcher.script(trimmed, AccessibleAttributeMatcher.slug(trimmed)));
    if (result && result.success) return { success: true, selector: result.selector, strategy: result.strategy };
    return { success: false, error: (result && result.error) || AccessibleAttributeMatcher.NO_MATCH };
  }

  static slug(text) {
    return text.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
  }

  static script(description, slug) {
    return `
(function() {
  try {${SelectorKit.HASHED_TOKEN_SRC}
    const DESC = ${JSON.stringify(description)};
    const SLUG = ${JSON.stringify(slug)};
    const esc = (s) => s.replace(/\\\\/g, '\\\\\\\\').replace(/"/g, '\\\\"');

    function uniqueSelectorFor(el) {
      // Machine-generated ids look unique but are regenerated on deploy.
      if (el.id && !isHashedToken(el.id)) return '#' + CSS.escape(el.id);
      if (el.dataset && el.dataset.testid) return '[data-testid="' + el.dataset.testid + '"]';
      const dr = el.getAttribute && el.getAttribute('data-role');
      if (dr) return '[data-role="' + dr + '"]';
      const al = el.getAttribute && el.getAttribute('aria-label');
      if (al) return el.tagName.toLowerCase() + '[aria-label="' + esc(al) + '"]';
      const nm = el.getAttribute && el.getAttribute('name');
      if (nm) return el.tagName.toLowerCase() + '[name="' + esc(nm) + '"]';
      return null;
    }

    function tryStrategy(selector) {
      try {
        const els = Array.from(document.querySelectorAll(selector));
        const interactable = els.filter(el => {
          const rect = el.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        });
        return { candidates: interactable, total: els.length };
      } catch (e) { return { candidates: [], total: 0 }; }
    }

    const strategies = [
      ['data-testid-slug', '[data-testid="' + esc(SLUG) + '"]'],
      ['data-testid-raw', '[data-testid="' + esc(DESC) + '"]'],
      ['aria-label',      '[aria-label="' + esc(DESC) + '"]'],
      ['placeholder',     '[placeholder="' + esc(DESC) + '"]'],
      ['data-role-slug',  '[data-role="' + esc(SLUG) + '"]'],
    ];

    for (const [name, sel] of strategies) {
      const r = tryStrategy(sel);
      if (r.candidates.length === 1) {
        const chosen = uniqueSelectorFor(r.candidates[0]) || sel;
        return { success: true, selector: chosen, strategy: name };
      }
    }

    // Visible-text exact-match strategy: walks all interactable elements.
    const textNodes = Array.from(document.querySelectorAll(
      'button, a, input[type="submit"], input[type="button"], [role="button"], [role="link"]'
    ));
    const wanted = DESC.toLowerCase();
    const matches = textNodes.filter(el => {
      const t = (el.innerText || el.textContent || el.value || '').trim().toLowerCase();
      if (!t) return false;
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return false;
      return t === wanted;
    });
    if (matches.length === 1) {
      const chosen = uniqueSelectorFor(matches[0]);
      if (chosen) return { success: true, selector: chosen, strategy: 'visible-text-exact' };
    }

    return { success: false, error: 'No deterministic match' };
  } catch (e) {
    return { success: false, error: e.message };
  }
})();`.trim();
  }
}

module.exports = AccessibleAttributeMatcher;

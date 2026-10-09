class SelectorValidation {
  static script(selector) {
    return `
(function() {
  try {
    const els = document.querySelectorAll(${JSON.stringify(selector)});
    let visible = 0;
    for (const el of els) {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) visible++;
    }
    return { ok: els.length >= 1, count: els.length, visible };
  } catch (e) {
    return { ok: false, count: 0, error: e.message };
  }
})();`.trim();
  }

  static verdict(probe) {
    const r = probe || {};
    return { ok: (r.count === 1) || (r.visible === 1), count: r.count || 0, error: r.error };
  }
}

module.exports = SelectorValidation;

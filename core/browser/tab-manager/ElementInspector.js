class ElementInspector {
  static async getElement(page, options = {}) {
    const { selector, text } = options;
    if (!selector) return { success: false, error: 'selector is required' };
    return page.runEnvelope(ElementInspector.elementScript(selector, text));
  }

  static async checkSelectors(page, selectors) {
    if (!Array.isArray(selectors) || selectors.length === 0) return { success: true, results: [] };
    const results = await page.run(ElementInspector.checkScript(selectors));
    return { success: true, results };
  }

  static elementScript(selector, text) {
    return `
(function() {
  try {
    const elements = document.querySelectorAll(${JSON.stringify(selector)});
    if (elements.length === 0) return { success: false, error: 'No elements found' };
    let el = elements[0];
    const filterText = ${JSON.stringify(text || null)};
    if (filterText) {
      for (const e of elements) { if (e.textContent.trim().includes(filterText)) { el = e; break; } }
    }
    const rect = el.getBoundingClientRect();
    const fullText = el.textContent.trim();
    return {
      success: true,
      tagName: el.tagName,
      text: fullText.substring(0, 200),
      textTruncated: fullText.length > 200,
      value: el.value !== undefined ? el.value : null,
      disabled: el.disabled || false,
      checked: el.checked !== undefined ? el.checked : null,
      readOnly: el.readOnly || false,
      href: el.href || null,
      src: el.src || null,
      className: el.className ? String(el.className).substring(0, 200) : '',
      id: el.id || null,
      name: el.name || null,
      type: el.type || null,
      placeholder: el.placeholder || null,
      boundingBox: { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) },
      visible: rect.width > 0 && rect.height > 0,
      matchCount: elements.length
    };
  } catch(e) { return { success: false, error: e.message }; }
})();`.trim();
  }

  static checkScript(selectors) {
    return `
(function() {
  var input = ${JSON.stringify(selectors)};
  var out = [];
  for (var i = 0; i < input.length; i++) {
    var sel = input[i];
    try {
      var matches = document.querySelectorAll(sel);
      out.push({ selector: sel, found: matches.length > 0, matchCount: matches.length, tagName: matches.length > 0 ? matches[0].tagName : null });
    } catch (e) {
      out.push({ selector: sel, found: false, matchCount: 0, tagName: null, error: e.message });
    }
  }
  return out;
})();`.trim();
  }
}

module.exports = ElementInspector;

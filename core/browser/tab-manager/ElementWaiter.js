class ElementWaiter {
  static POLL_INTERVAL_MS = 200;
  static DEFAULT_TIMEOUT_MS = 5000;

  static async waitFor(page, options = {}) {
    const { selector, text, state = 'visible', timeout = ElementWaiter.DEFAULT_TIMEOUT_MS } = options;
    if (!selector) return { success: false, error: 'selector is required' };
    const script = ElementWaiter.script(selector, text, state);
    const maxAttempts = Math.ceil(timeout / ElementWaiter.POLL_INTERVAL_MS);
    for (let i = 0; i < maxAttempts; i++) {
      const result = await page.run(script);
      if (result.found) return { success: true, data: result };
      await new Promise((resolve) => setTimeout(resolve, ElementWaiter.POLL_INTERVAL_MS));
    }
    return { success: false, error: `Timeout after ${timeout}ms waiting for ${selector}` };
  }

  static script(selector, text, state) {
    return `
(function() {
  const el = document.querySelector(${JSON.stringify(selector)});
  const filterText = ${JSON.stringify(text || null)};
  if (${JSON.stringify(state)} === 'hidden') return !el ? { found: true } : { found: false };
  if (!el) return { found: false };
  if (filterText && !el.textContent.includes(filterText)) return { found: false };
  return { found: true, tagName: el.tagName, text: el.textContent.trim().substring(0, 100) };
})();`.trim();
  }
}

module.exports = ElementWaiter;

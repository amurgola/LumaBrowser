class DialogHandler {
  static async install(page, options = {}) {
    return page.runEnvelope(DialogHandler.script(options));
  }

  static script({ action = 'accept', promptText } = {}) {
    return `
(function() {
  try {
    const action = ${JSON.stringify(action)};
    const promptValue = ${JSON.stringify(promptText || '')};
    window.__dialogHistory = window.__dialogHistory || [];
    window.alert = function(msg) { window.__dialogHistory.push({ type: 'alert', message: msg, timestamp: new Date().toISOString() }); };
    window.confirm = function(msg) {
      window.__dialogHistory.push({ type: 'confirm', message: msg, result: action === 'accept', timestamp: new Date().toISOString() });
      return action === 'accept';
    };
    window.prompt = function(msg, def) {
      const result = action === 'accept' ? (promptValue || def || '') : null;
      window.__dialogHistory.push({ type: 'prompt', message: msg, result, timestamp: new Date().toISOString() });
      return result;
    };
    return { success: true, action, message: 'Dialog handlers installed.' };
  } catch(e) { return { success: false, error: e.message }; }
})();`.trim();
  }
}

module.exports = DialogHandler;

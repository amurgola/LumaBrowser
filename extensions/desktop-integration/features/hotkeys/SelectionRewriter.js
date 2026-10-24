class SelectionRewriter {
  static DEFAULT_INSTRUCTION = 'Rewrite this to be clearer and more concise. Reply with only the rewritten text.';
  static DEFAULT_TIMEOUT_MS = 60000;
  static MAX_INPUT = 20000;
  static GRACE_MS = 2000;

  constructor({ getRouter }) {
    this._getRouter = getRouter;
  }

  available() {
    const router = this._getRouter();
    return !!router && typeof router.complete === 'function';
  }

  async rewrite(text, { instruction = '', modelRef = '', timeoutMs = SelectionRewriter.DEFAULT_TIMEOUT_MS } = {}) {
    const input = String(text == null ? '' : text);
    if (!input.trim()) return { success: false, error: 'Nothing to rewrite', code: 'EMPTY' };
    if (input.length > SelectionRewriter.MAX_INPUT) {
      return { success: false, error: `The selection is longer than ${SelectionRewriter.MAX_INPUT} characters`, code: 'TOO_LONG' };
    }
    const router = this._getRouter();
    if (!router || typeof router.complete !== 'function') return { success: false, error: 'The AI chat is not running', code: 'NO_MODEL' };
    const request = {
      messages: [
        { role: 'system', content: String(instruction || '').trim() || SelectionRewriter.DEFAULT_INSTRUCTION },
        { role: 'user', content: input },
      ],
      temperature: 0.3,
      modelRef: String(modelRef || '').trim() || undefined,
      timeoutMs,
      noThink: true,
    };
    let result;
    try {
      result = await SelectionRewriter._withTimeout(router.complete(request), timeoutMs + SelectionRewriter.GRACE_MS);
    } catch (err) {
      return { success: false, error: (err && err.message) || String(err), code: err && err.code === 'TIMEOUT' ? 'TIMEOUT' : 'FAILED' };
    }
    if (!result || typeof result.text !== 'string') {
      const error = (result && result.error) || 'The model gave no answer';
      return { success: false, error, code: /no model/i.test(error) ? 'NO_MODEL' : /timeout/i.test(error) ? 'TIMEOUT' : 'FAILED' };
    }
    const clean = SelectionRewriter.clean(result.text);
    if (!clean) return { success: false, error: 'The model gave an empty answer', code: 'EMPTY' };
    return { success: true, text: clean };
  }

  static clean(raw) {
    let text = String(raw || '').replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
    const fence = text.match(/^```[^\n]*\n([\s\S]*?)\n?```$/);
    if (fence) text = fence[1].trim();
    const quoted = text.match(/^(["“])([\s\S]*)(["”])$/);
    if (quoted && !quoted[2].includes('"')) text = quoted[2].trim();
    return text;
  }

  static _withTimeout(promise, ms) {
    let timer;
    const timeout = new Promise((_, reject) => {
      timer = setTimeout(() => {
        const err = new Error('The model took too long');
        err.code = 'TIMEOUT';
        reject(err);
      }, ms);
    });
    return Promise.race([Promise.resolve(promise), timeout]).finally(() => clearTimeout(timer));
  }
}

module.exports = SelectionRewriter;

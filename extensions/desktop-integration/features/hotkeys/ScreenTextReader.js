const SelectionRewriter = require('./SelectionRewriter');

class ScreenTextReader {
  static NO_TEXT = 'NO_TEXT';
  static INSTRUCTION = 'Transcribe the text in this image in natural reading order, as plain text, with no commentary. '
    + 'Skip window chrome such as toolbars, menus and buttons unless they are the only text. '
    + `Reply with only the text. If there is no readable text, reply ${ScreenTextReader.NO_TEXT}.`;
  static DEFAULT_TIMEOUT_MS = 60000;

  constructor({ getRouter }) {
    this._getRouter = getRouter;
  }

  available(modelRef = '') {
    const router = this._router();
    if (!router || (typeof router.modelVisionActive !== 'function' && typeof router.modelVisionSupport !== 'function')) return false;
    try {
      const ref = this._resolve(router, modelRef);
      if (!ref) return false;
      if (typeof router.modelVisionSupport === 'function') return router.modelVisionSupport(ref) !== 'none';
      return !!router.modelVisionActive(ref);
    } catch (_) {
      return false;
    }
  }

  async read(png, { modelRef = '', timeoutMs = ScreenTextReader.DEFAULT_TIMEOUT_MS } = {}) {
    const router = this._router();
    if (!router) return { success: false, error: 'The AI chat is not running', code: 'NO_MODEL' };
    if (!this.available(modelRef)) return { success: false, error: 'The chat model cannot see images', code: 'NO_VISION' };
    const request = {
      messages: [
        { role: 'system', content: ScreenTextReader.INSTRUCTION },
        { role: 'user', content: 'Read out the text in this screenshot.' },
      ],
      images: [{ kind: 'image', name: 'screen.png', mime: 'image/png', base64: Buffer.from(png).toString('base64') }],
      temperature: 0,
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
    if (!result || typeof result.text !== 'string') return { success: false, error: (result && result.error) || 'The model gave no answer', code: 'FAILED' };
    const text = SelectionRewriter.clean(result.text);
    if (!text || text.replace(/[\s.]/g, '') === ScreenTextReader.NO_TEXT) return { success: false, error: 'No text was found there', code: 'EMPTY' };
    return { success: true, text };
  }

  _router() {
    const router = this._getRouter();
    return router && typeof router.complete === 'function' ? router : null;
  }

  _resolve(router, modelRef) {
    const given = String(modelRef || '').trim() || undefined;
    return typeof router.resolveModelRef === 'function' ? router.resolveModelRef(given) : given;
  }
}

module.exports = ScreenTextReader;

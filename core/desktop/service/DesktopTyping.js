const DesktopError = require('../DesktopError');
const TypingMode = require('./TypingMode');

class DesktopTyping {
  constructor(parts) {
    this._parts = parts;
  }

  async type(w, args) {
    const text = String(args.text ?? '');
    const mode = args.mode == null ? 'auto' : String(args.mode);
    if (!TypingMode.isValid(mode)) return { success: false, error: `mode must be one of ${TypingMode.MODES.join(', ')}.` };
    const refusal = this._parts.guards.targetRefusal(w);
    if (refusal) return DesktopError.toResult(refusal);
    const ref = args.ref != null && this._parts.observation.isFor(w.hwnd) ? Number(args.ref) : null;
    try {
      return await this._type(w, { text, mode, ref, submit: args.submit === true });
    } catch (e) {
      return DesktopError.toResult(e);
    }
  }

  async _type(w, { text, mode, ref, submit }) {
    if (mode === 'auto' && ref != null && !submit && await this._setValue(ref, text)) {
      return { success: true, data: { method: 'uia:setValue' } };
    }
    const paste = this._wantsPaste(mode, text);
    if (paste && !this._parts.clipboard) return { success: false, error: 'Clipboard paste is not available here; use mode "keys".' };
    const human = this._parts.guards.humanNeeded();
    if (human) return DesktopError.toResult(human);
    if (!(await this._parts.bringToFront(w))) return { success: false, error: `Could not bring "${w.title}" to the front to type.` };
    if (ref != null) await this._parts.uia().act(ref, 'focus').catch(() => {});
    const restored = await this._enterText(w, text, paste);
    if (submit) this._parts.keyboard.enter(w);
    return { success: true, data: { method: paste ? 'paste' : 'keyboard', chars: text.length, ...(paste ? { clipboardRestored: restored } : {}) } };
  }

  async _setValue(ref, text) {
    const r = await this._parts.uia().act(ref, 'setValue', text).catch(() => null);
    return !!(r && r.done === 'setValue');
  }

  _wantsPaste(mode, text) {
    return mode === 'paste' || (mode === 'auto' && !!this._parts.clipboard && TypingMode.shouldPaste(text));
  }

  async _enterText(w, text, paste) {
    if (paste) return this._parts.keyboard.paste(w, text, this._parts.clipboard);
    this._parts.keyboard.typeKeys(w, text);
    return null;
  }
}

module.exports = DesktopTyping;

class UserArgs {
  static splitShellArgs(text) {
    if (typeof text !== 'string') return [];
    const state = { tokens: [], current: '', inToken: false, quote: null };
    for (const ch of text) UserArgs._consumeChar(state, ch);
    if (state.inToken) state.tokens.push(state.current);
    return state.tokens;
  }

  static normalize(input) {
    if (Array.isArray(input)) return input.filter((arg) => typeof arg === 'string' && arg.length > 0);
    return UserArgs.splitShellArgs(input);
  }

  static _consumeChar(state, ch) {
    if (state.quote) return UserArgs._consumeQuotedChar(state, ch);
    if (ch === '"' || ch === "'") return UserArgs._openQuote(state, ch);
    if (/\s/.test(ch)) return UserArgs._endToken(state);
    state.current += ch;
    state.inToken = true;
  }

  static _consumeQuotedChar(state, ch) {
    if (ch === state.quote) state.quote = null;
    else state.current += ch;
  }

  static _openQuote(state, ch) {
    state.quote = ch;
    state.inToken = true;
  }

  static _endToken(state) {
    if (!state.inToken) return;
    state.tokens.push(state.current);
    state.current = '';
    state.inToken = false;
  }
}

module.exports = UserArgs;

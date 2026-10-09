class SelectorKit {
  static HASHED_TOKEN_PATTERNS = [
    /^css-[a-z0-9]+$/i,
    /^_[a-z0-9]{5,}$/i,
    /^sc-[a-zA-Z][a-zA-Z0-9]*$/,
    /^svelte-[a-z0-9]+$/i,
    /^jsx-[0-9]+$/,
    /^emotion-[a-z0-9]+$/i,
    /^[a-f0-9]{8,}$/i,
    /^[a-z]{1,3}-[a-z0-9]{6,}$/i,
  ];

  static HASHED_TOKEN_SRC = `
    var HASHED_TOKEN_PATTERNS = [${SelectorKit.HASHED_TOKEN_PATTERNS.map(String).join(', ')}];
    function isHashedToken(token) {
      if (!token || typeof token !== 'string') return false;
      for (var hi = 0; hi < HASHED_TOKEN_PATTERNS.length; hi++) {
        if (HASHED_TOKEN_PATTERNS[hi].test(token)) return true;
      }
      return false;
    }`;

  static isHashedToken(token) {
    if (!token || typeof token !== 'string') return false;
    return SelectorKit.HASHED_TOKEN_PATTERNS.some((pattern) => pattern.test(token));
  }
}

module.exports = SelectorKit;

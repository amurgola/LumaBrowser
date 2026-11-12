class RoleplaySamplers {
  static LOCAL = Object.freeze({
    dry_multiplier: 0.8,
    dry_base: 1.75,
    dry_allowed_length: 2,
    min_p: 0.02,
  });

  static TOKENS_PER_WORD = 4;
  static REASONING_ROOM = 1536;

  static replyCap(wordCap) {
    const words = Number(wordCap) || 0;
    return words > 0 ? RoleplaySamplers.REASONING_ROOM + Math.round(words * RoleplaySamplers.TOKENS_PER_WORD) : 0;
  }

  static forTurn(data) {
    const opts = (data && data.options) || {};
    if (opts.noSamplers) return null;
    return Object.assign({}, RoleplaySamplers.LOCAL);
  }
}

module.exports = RoleplaySamplers;

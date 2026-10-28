class RoleplaySamplers {
  static LOCAL = Object.freeze({
    dry_multiplier: 0.8,
    dry_base: 1.75,
    dry_allowed_length: 2,
    dry_penalty_last_n: -1,
    xtc_threshold: 0.1,
    xtc_probability: 0.5,
    min_p: 0.02,
  });

  static forTurn(data) {
    const opts = (data && data.options) || {};
    if (opts.noSamplers) return null;
    return Object.assign({}, RoleplaySamplers.LOCAL);
  }
}

module.exports = RoleplaySamplers;

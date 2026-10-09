class AutoContextPick {
  static ladder(kvOptions, modes, rungCount) {
    const out = [];
    for (let i = 0; i < rungCount; i += 1) {
      const across = modes.map((mode) => kvOptions[mode.id][i]);
      out.push(across.find((o) => o.source === 'fit' && o.state === 'ok')
        || across.find((o) => o.source === 'fit')
        || across[0]);
    }
    return out;
  }

  static recommendedTokens(contextOptions) {
    return AutoContextPick._largest(contextOptions, (o) => o.source === 'fit' && o.state === 'ok')
      || AutoContextPick._largest(contextOptions, (o) => o.state === 'ok')
      || AutoContextPick._largest(contextOptions, (o) => o.state === 'partial')
      || (contextOptions[0] && contextOptions[0].tokens)
      || null;
  }

  static _largest(options, predicate) {
    const tokens = options.filter(predicate).map((o) => o.tokens);
    return tokens.length ? Math.max(...tokens) : null;
  }
}

module.exports = AutoContextPick;

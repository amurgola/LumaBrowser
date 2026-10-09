class PathPrefixRewrite {
  static variants(oldPrefix, newPrefix) {
    if (!oldPrefix || !newPrefix || oldPrefix === newPrefix) return [];
    const pairs = [[oldPrefix, newPrefix]];
    const escapedOld = PathPrefixRewrite._jsonEscape(oldPrefix);
    if (escapedOld !== oldPrefix) pairs.push([escapedOld, PathPrefixRewrite._jsonEscape(newPrefix)]);
    return pairs;
  }

  static apply(text, variants) {
    return variants.reduce((current, [from, to]) => current.split(from).join(to), text);
  }

  static _jsonEscape(value) {
    return JSON.stringify(value).slice(1, -1);
  }
}

module.exports = PathPrefixRewrite;

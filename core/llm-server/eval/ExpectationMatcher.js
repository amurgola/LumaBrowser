class ExpectationMatcher {
  static WILDCARD_TOOL = '*';

  static safeRegex(pattern, flags) {
    try {
      return new RegExp(pattern, flags || '');
    } catch (_) {
      return /$^/;
    }
  }

  static matchValue(matcher, actual) {
    if (matcher === null || typeof matcher !== 'object') return ExpectationMatcher._looselyEqual(actual, matcher);
    if ('exists' in matcher) return ExpectationMatcher._matchExists(matcher.exists, actual);
    if ('regex' in matcher) return ExpectationMatcher.safeRegex(matcher.regex, matcher.flags).test(ExpectationMatcher._text(actual));
    if ('equals' in matcher) return ExpectationMatcher._looselyEqual(actual, matcher.equals);
    if ('contains' in matcher) return ExpectationMatcher._text(actual).includes(String(matcher.contains));
    if ('oneOf' in matcher) return ExpectationMatcher._matchOneOf(matcher.oneOf, actual);
    if ('gte' in matcher || 'lte' in matcher) return ExpectationMatcher._matchRange(matcher, actual);
    return false;
  }

  static matchParams(expectedParams, actualParams) {
    if (!expectedParams) return true;
    const actual = actualParams || {};
    return Object.entries(expectedParams).every(([key, matcher]) => ExpectationMatcher.matchValue(matcher, actual[key]));
  }

  static callMatches(spec, call) {
    if (!call) return false;
    if (spec.tool && spec.tool !== ExpectationMatcher.WILDCARD_TOOL && call.tool !== spec.tool) return false;
    if (spec.params && !ExpectationMatcher.matchParams(spec.params, call.params)) return false;
    if (spec.success !== undefined && Boolean(call.success) !== Boolean(spec.success)) return false;
    return true;
  }

  static _looselyEqual(actual, expected) {
    return actual === expected || String(actual) === String(expected);
  }

  static _text(value) {
    return String(value == null ? '' : value);
  }

  static _matchExists(shouldExist, actual) {
    const has = actual !== undefined && actual !== null;
    return shouldExist ? has : !has;
  }

  static _matchOneOf(options, actual) {
    return Array.isArray(options) && options.some((option) => ExpectationMatcher._looselyEqual(actual, option));
  }

  static _matchRange(matcher, actual) {
    const n = Number(actual);
    if (Number.isNaN(n)) return false;
    if ('gte' in matcher && n < matcher.gte) return false;
    if ('lte' in matcher && n > matcher.lte) return false;
    return true;
  }
}

module.exports = ExpectationMatcher;

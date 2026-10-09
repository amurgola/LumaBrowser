const ExpectationMatcher = require('../../eval/ExpectationMatcher');

class TriggerFilter {
  static MAX_RULES = 20;

  static getPath(obj, dottedPath) {
    if (obj == null) return undefined;
    let current = obj;
    for (const step of TriggerFilter._steps(dottedPath)) {
      if (current == null || typeof current !== 'object') return undefined;
      current = current[step];
    }
    return current;
  }

  static normalize(filter) {
    if (!filter || typeof filter !== 'object' || Array.isArray(filter)) return null;
    const out = {};
    let count = 0;
    for (const [rawKey, matcher] of Object.entries(filter)) {
      const key = String(rawKey || '').trim();
      if (!key || matcher === undefined) continue;
      out[key] = matcher;
      if (++count >= TriggerFilter.MAX_RULES) break;
    }
    return count ? out : null;
  }

  static evaluate(filter, event) {
    const rules = TriggerFilter.normalize(filter);
    if (!rules) return { pass: true, failed: [] };
    const failed = Object.entries(rules)
      .filter(([dottedPath, matcher]) => !TriggerFilter._ruleHolds(matcher, TriggerFilter.getPath(event, dottedPath)))
      .map(([dottedPath]) => dottedPath);
    return { pass: failed.length === 0, failed };
  }

  static _ruleHolds(matcher, actual) {
    if (TriggerFilter._isExistsMatcher(matcher)) return ExpectationMatcher.matchValue(matcher, actual);
    if (actual === undefined) return false;
    return ExpectationMatcher.matchValue(matcher, actual);
  }

  static _isExistsMatcher(matcher) {
    return !!matcher && typeof matcher === 'object' && !Array.isArray(matcher) && 'exists' in matcher;
  }

  static _steps(dottedPath) {
    return String(dottedPath || '').split('.').filter(Boolean);
  }
}

module.exports = TriggerFilter;

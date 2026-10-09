const AgentLoopText = require('./AgentLoopText');

class LargeStringShrinker {
  static MIN_KEPT = 1024;
  static CANDIDATE_MIN = 2048;
  static NOTICE_SLACK = 300;

  static shrink(result, excessChars) {
    const clone = JSON.parse(JSON.stringify(result));
    let toRemove = excessChars;
    for (const field of LargeStringShrinker._largeStrings(clone)) {
      if (toRemove <= 0) break;
      toRemove -= LargeStringShrinker._cut(field, toRemove);
    }
    return clone;
  }

  static _cut(field, toRemove) {
    const value = field.container[field.key];
    const keep = Math.max(LargeStringShrinker.MIN_KEPT, value.length - toRemove - LargeStringShrinker.NOTICE_SLACK);
    if (keep >= value.length) return 0;
    field.container[field.key] = value.slice(0, keep) + AgentLoopText.truncatedField(keep, value.length);
    return value.length - keep;
  }

  static _largeStrings(root) {
    const found = [];
    const walk = (node) => {
      if (!node || typeof node !== 'object') return;
      for (const key of Object.keys(node)) {
        const value = node[key];
        if (typeof value === 'string') {
          if (value.length >= LargeStringShrinker.CANDIDATE_MIN) found.push({ container: node, key, length: value.length });
        } else if (value && typeof value === 'object') {
          walk(value);
        }
      }
    };
    walk(root);
    return found.sort((a, b) => b.length - a.length);
  }
}

module.exports = LargeStringShrinker;

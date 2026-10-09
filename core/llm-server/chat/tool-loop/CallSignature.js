class CallSignature {
  static NUMERIC = /^-?\d+(\.\d+)?$/;

  static of(name, params) {
    const facts = [];
    CallSignature._collect(params, '', facts, new WeakSet());
    return new CallSignature(String(name), facts.sort());
  }

  constructor(name, facts) {
    this.name = name;
    this.facts = facts;
    this.key = `${name}(${facts.join('; ')})`;
  }

  matches(other) {
    return !!other && other.key === this.key;
  }

  static _collect(value, path, facts, seen) {
    if (value == null) return;
    if (typeof value === 'object') {
      CallSignature._collectNested(value, path, facts, seen);
      return;
    }
    const scalar = CallSignature._scalar(value);
    if (scalar !== '') facts.push(`${path}=${scalar}`);
  }

  static _collectNested(value, path, facts, seen) {
    if (seen.has(value)) {
      facts.push(`${path}=<cycle>`);
      return;
    }
    seen.add(value);
    const entries = Array.isArray(value) ? value.map((v, i) => [`[${i}]`, v]) : Object.entries(value);
    for (const [key, child] of entries) {
      const childPath = Array.isArray(value) ? `${path}${key}` : (path ? `${path}.${key}` : key);
      CallSignature._collect(child, childPath, facts, seen);
    }
  }

  static _scalar(value) {
    if (typeof value !== 'string') return String(value);
    const text = value.replace(/\s+/g, ' ').trim();
    return CallSignature.NUMERIC.test(text) ? String(Number(text)) : text;
  }
}

module.exports = CallSignature;

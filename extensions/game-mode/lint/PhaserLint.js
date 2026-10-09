const CommentBlanker = require('./CommentBlanker');
const PhaserLintRules = require('./PhaserLintRules');
const ShapeStyleCheck = require('./ShapeStyleCheck');

class PhaserLint {
  static MAX_FINDINGS = 20;

  static lint(source) {
    const src = String(source == null ? '' : source);
    if (!src) return [];
    const text = CommentBlanker.blank(src);
    const raw = [...PhaserLint._ruleFindings(text), ...ShapeStyleCheck.findings(text)];
    raw.sort((a, b) => a.index - b.index);
    return PhaserLint._dedupe(src, raw);
  }

  static formatFindings(findings) {
    if (!findings || !findings.length) return '';
    const lines = findings.map((f) => `- line ${f.line}: ${f.message}`);
    const calls = `${findings.length} call${findings.length === 1 ? '' : 's'}`;
    return `PHASER API CHECK: ${calls} here will fail at runtime:\n${lines.join('\n')}\nFix these with another edit before moving on.`;
  }

  static lineAt(src, index) {
    let line = 1;
    for (let i = 0; i < index && i < src.length; i++) if (src[i] === '\n') line++;
    return line;
  }

  static _ruleFindings(text) {
    const raw = [];
    for (const rule of PhaserLintRules.RULES) {
      rule.re.lastIndex = 0;
      let m;
      while ((m = rule.re.exec(text))) {
        raw.push({ index: m.index, id: rule.id, message: typeof rule.message === 'function' ? rule.message(m) : rule.message });
        if (raw.length > PhaserLint.MAX_FINDINGS * 4) break;
      }
    }
    return raw;
  }

  static _dedupe(src, raw) {
    const seen = new Set();
    const out = [];
    for (const f of raw) {
      const line = PhaserLint.lineAt(src, f.index);
      const key = `${f.id}:${line}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ line, id: f.id, message: f.message });
      if (out.length >= PhaserLint.MAX_FINDINGS) break;
    }
    return out;
  }
}

module.exports = PhaserLint;

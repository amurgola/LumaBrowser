const PromptBudget = require('../prompts/PromptBudget');

class ContextAudit {
  static SHINGLE = 6;
  static ANCHOR_MARK = '[Scene notes';
  static DUPES_MAX = 8;

  static of(messages) {
    const list = Array.isArray(messages) ? messages : [];
    const text = (m) => String((m && m.content) || '');
    const sys = list.length && list[0].role === 'system' ? text(list[0]) : '';
    const rest = sys ? list.slice(1) : list.slice();
    const last = rest.length ? text(rest[rest.length - 1]) : '';
    const history = rest.slice(0, -1);
    const anchorAt = last.indexOf(ContextAudit.ANCHOR_MARK);
    const anchor = anchorAt >= 0 ? last.slice(anchorAt) : '';
    const user = anchorAt >= 0 ? last.slice(0, anchorAt) : last;
    const sections = ContextAudit.sections(sys);
    const layers = {};
    for (const s of sections) layers[s.name] = (layers[s.name] || 0) + PromptBudget.estimate(s.text);
    const historyText = history.map(text).join('\n');
    const thinkText = (historyText.match(/<think>[\s\S]*?<\/think>/gi) || []).join('');
    const parts = sections.concat([{ name: 'history', text: historyText }, { name: 'scene notes', text: anchor }]);
    const duplicates = ContextAudit.duplicates(parts);
    return {
      total: PromptBudget.estimate(list.map(text).join('\n')),
      system: PromptBudget.estimate(sys),
      layers,
      history: PromptBudget.estimate(historyText),
      historyMessages: history.length,
      think: PromptBudget.estimate(thinkText),
      anchor: PromptBudget.estimate(anchor),
      user: PromptBudget.estimate(user),
      duplicates: duplicates.slice(0, ContextAudit.DUPES_MAX),
      duplicateWords: duplicates.reduce((n, d) => n + d.words, 0),
    };
  }

  static sections(sys) {
    const out = [];
    const chunks = String(sys || '').split(/\n(?=## )/);
    chunks.forEach((chunk, i) => {
      const m = chunk.match(/^## ([^\n]+)/);
      const name = m ? m[1].trim().toLowerCase() : (i === 0 ? 'brief' : 'other');
      if (chunk.trim()) out.push({ name, text: chunk });
    });
    return out;
  }

  static duplicates(parts) {
    const sets = parts.map((p) => ({ name: p.name, set: ContextAudit.shingles(p.text) }));
    const out = [];
    for (let i = 0; i < sets.length; i += 1) {
      for (let j = i + 1; j < sets.length; j += 1) {
        if (sets[i].name === sets[j].name) continue;
        const shared = [...sets[i].set].filter((s) => sets[j].set.has(s));
        if (shared.length) out.push({ a: sets[i].name, b: sets[j].name, words: shared.length, sample: shared[0] });
      }
    }
    return out.sort((x, y) => y.words - x.words);
  }

  static shingles(text) {
    const words = String(text || '').toLowerCase().match(/[a-z0-9']+/g) || [];
    const set = new Set();
    for (let i = 0; i + ContextAudit.SHINGLE <= words.length; i += 1) set.add(words.slice(i, i + ContextAudit.SHINGLE).join(' '));
    return set;
  }

  static summary(audits) {
    const list = (audits || []).filter(Boolean);
    if (!list.length) return null;
    const avg = (f) => Math.round(list.reduce((n, a) => n + (f(a) || 0), 0) / list.length);
    const names = [...new Set(list.flatMap((a) => Object.keys(a.layers)))];
    const layers = Object.fromEntries(names.map((n) => [n, avg((a) => a.layers[n])]));
    return {
      turns: list.length, total: avg((a) => a.total), system: avg((a) => a.system), history: avg((a) => a.history),
      anchor: avg((a) => a.anchor), think: avg((a) => a.think), duplicateWords: avg((a) => a.duplicateWords), layers,
      peak: Math.max(...list.map((a) => a.total)),
    };
  }
}

module.exports = ContextAudit;

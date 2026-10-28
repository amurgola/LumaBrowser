const ProseSlop = require('./ProseSlop');

class ProsePolishPrompt {
  static PASSAGE_MAX = 6000;

  static messages(content, flagged) {
    const phrases = Array.from(new Set(flagged.flatMap((p) => ProseSlop.hits(p.text).map((h) => h.phrase))));
    const system = '/no_think\n'
      + 'You are a line editor for roleplay prose. Rewrite ONLY the numbered paragraphs you are given so they read '
      + 'as concrete, immediate fiction: replace each flagged phrase with one specific observable detail tied to '
      + 'something in the scene. Keep every event, every line of dialogue word for word, every name, every '
      + '`**Name:**` speaker tag, the tense and the point of view. Do not add events, lines or paragraphs. Keep each '
      + 'paragraph about the same length. Respond with ONLY a minified JSON object {"paragraphs":{"<number>":"<text>"}} '
      + 'with one entry per numbered paragraph, no prose, no fences.';
    const user = 'Flagged phrases: ' + (phrases.join('; ') || '(none)') + '\n\n'
      + flagged.map((p) => p.index + ': ' + p.text).join('\n\n').slice(0, ProsePolishPrompt.PASSAGE_MAX) + '\n\nJSON:';
    return [{ role: 'system', content: system }, { role: 'user', content: user }];
  }

  static parse(text) {
    if (!text || typeof text !== 'string') return null;
    const s = text.replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/```(?:json)?/gi, '').trim();
    const a = s.indexOf('{');
    const b = s.lastIndexOf('}');
    if (a < 0 || b <= a) return null;
    let obj;
    try { obj = JSON.parse(s.slice(a, b + 1)); } catch (_) { return null; }
    const paras = obj && typeof obj === 'object' ? (obj.paragraphs && typeof obj.paragraphs === 'object' ? obj.paragraphs : obj) : null;
    if (!paras) return null;
    const out = {};
    for (const [k, v] of Object.entries(paras)) {
      const i = parseInt(k, 10);
      if (Number.isFinite(i) && typeof v === 'string' && v.trim()) out[i] = v.trim();
    }
    return Object.keys(out).length ? out : null;
  }

  static splice(content, rewrites) {
    const paras = String(content || '').split(/\n{2,}/);
    let changed = false;
    for (const [k, text] of Object.entries(rewrites || {})) {
      const i = Number(k);
      if (!(i >= 0 && i < paras.length) || !ProsePolishPrompt.keepsSubstance(paras[i], text)) continue;
      if (paras[i] !== text) { paras[i] = text; changed = true; }
    }
    return { content: paras.join('\n\n'), changed };
  }

  static keepsSubstance(before, after) {
    const tag = before.match(/^\*\*[^*\n]{1,40}\*\*\s*:?|^\*\*[^*\n:]{1,40}:\s*\*\*/);
    if (tag && !after.startsWith(tag[0])) return false;
    const quotes = before.match(/"[^"\n]{2,}"/g) || [];
    return quotes.every((q) => after.includes(q));
  }
}

module.exports = ProsePolishPrompt;

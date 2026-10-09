export default class ReplyChoices {
  static FENCE = '```choices';

  static MAX = 4;

  static stripStreaming(raw) {
    const s = String(raw || '');
    const i = s.indexOf(ReplyChoices.FENCE);
    return i === -1 ? s : s.slice(0, i);
  }

  static parse(md) {
    const s = String(md || '');
    const m = s.match(/```choices[^\S\n]*\n?([\s\S]*?)(?:```|$)/);
    if (!m) return { text: s, choices: null };
    const text = (s.slice(0, m.index) + s.slice(m.index + m[0].length)).trim();
    const items = ReplyChoices._items((m[1] || '').trim())
      .map((x) => x.trim()).filter(Boolean).slice(0, ReplyChoices.MAX);
    return { text, choices: items.length ? items : null };
  }

  static _items(raw) {
    const json = ReplyChoices._jsonArray(raw);
    if (json) return json;
    return raw.split('\n')
      .map((l) => l.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, '').replace(/^"|",?$/g, '').trim())
      .filter(Boolean);
  }

  static _jsonArray(raw) {
    try {
      const j = JSON.parse(raw);
      return Array.isArray(j) ? j.map((x) => String(x)) : null;
    } catch (_) {
      return null;
    }
  }
}

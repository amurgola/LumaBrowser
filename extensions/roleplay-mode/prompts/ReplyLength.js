class ReplyLength {
  static OVERRUN = 2;
  static KEEP = 2;
  static MEMORY = 64;
  static _caps = new Map();
  static SENTENCE_END = /(?<!\b(?:Mr|Mrs|Ms|Dr|St|Sr|Jr|Lt|Sgt|Capt|Prof))[.!?]["')\]*_]*(?=\s|$)/g;

  static remember(conversationId, words) {
    if (!conversationId) return;
    const map = ReplyLength._caps;
    map.delete(conversationId);
    if (Number(words) > 0) map.set(conversationId, Math.round(Number(words)));
    while (map.size > ReplyLength.MEMORY) map.delete(map.keys().next().value);
  }

  static recall(conversationId) {
    return ReplyLength._caps.get(conversationId) || 0;
  }

  static words(text) {
    return String(text || '').split(/\s+/).filter(Boolean).length;
  }

  static trim(text, cap) {
    const original = String(text || '');
    const limit = Number(cap) || 0;
    if (!limit || ReplyLength.words(original) <= limit * ReplyLength.OVERRUN) return original;
    const room = Math.round(limit * ReplyLength.KEEP);
    const paragraphs = original.trim().split(/\n{2,}/);
    const kept = [];
    let used = 0;
    for (const p of paragraphs) {
      const n = ReplyLength.words(p);
      if (kept.length && used + n > room) break;
      kept.push(p);
      used += n;
    }
    if (used > room && kept.length === 1) kept[0] = ReplyLength._sentences(kept[0], room);
    const out = kept.join('\n\n').trim();
    return out && out.length < original.trim().length ? out : original;
  }

  static _sentences(paragraph, room) {
    let end = 0;
    for (const m of paragraph.matchAll(ReplyLength.SENTENCE_END)) {
      const stop = m.index + m[0].length;
      if (end && ReplyLength.words(paragraph.slice(0, stop)) > room) break;
      end = stop;
      if (ReplyLength.words(paragraph.slice(0, stop)) >= room) break;
    }
    return end ? paragraph.slice(0, end) : paragraph;
  }
}

module.exports = ReplyLength;

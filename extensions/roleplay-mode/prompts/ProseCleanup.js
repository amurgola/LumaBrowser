class ProseCleanup {
  static HEADING = /^[ \t]{0,3}#{1,6}[ \t]+[^\n]*\n?/;
  static BOLD_TITLE = /^[ \t]*\*\*[^*\n:]{2,80}\*\*[ \t]*\n/;
  static RULE = /^[ \t]*(?:-{3,}|\*{3,}|_{3,})[ \t]*$/gm;
  static NOTE_LABEL = /^[ \t]*[*_]{0,2}(?:pressure(?: builds| mounts| rises)?|scene notes?|story state|open (?:threads?|questions?)|handoff|narrator(?:'s)? notes?)[*_]{0,2}[ \t]*:[*_]{0,2}[ \t]*/i;

  static clean(text) {
    const original = String(text || '');
    let s = original.replace(/^\s+/, '');
    for (let i = 0; i < 3 && ProseCleanup.HEADING.test(s); i += 1) s = s.replace(ProseCleanup.HEADING, '').replace(/^\s+/, '');
    if (ProseCleanup.BOLD_TITLE.test(s) && /\n\s*\S/.test(s)) s = s.replace(ProseCleanup.BOLD_TITLE, '').replace(/^\s+/, '');
    s = s.split(/\n{2,}/).map((para) => ProseCleanup.quoteSpeech(ProseCleanup._paragraph(para))).filter((para) => para.trim()).join('\n\n');
    s = s.replace(ProseCleanup.RULE, '').replace(/\n{3,}/g, '\n\n').trim();
    return s === original.trim() ? original : s;
  }

  static SPEAKER = /^(\*\*\s*[^*\n:]{1,40}?\s*:\s*\*\*|\*\*\s*[^*\n:]{1,40}?\s*\*\*\s*:)\s*/;
  static QUOTES = /["\u201c\u201d\u00ab\u00bb]/;
  static FIRST_PERSON = /(?:^|[\s(\u2026.])(?:I|I'm|I'll|I've|I'd|me|my|mine|we|we're|we'll|our|us)(?=[\s,.!?;:)\u2026]|$)/;
  static ADDRESS = /^(?:\u2026|\.\.\.)?\s*(?:you|you're|you've|you'll|you'd|your|yours)\b/i;

  static quoteSpeech(para) {
    const m = para.match(ProseCleanup.SPEAKER);
    if (!m) return para;
    const body = para.slice(m[0].length);
    if (!body.trim() || ProseCleanup.QUOTES.test(body) || /\n/.test(body.trim())) return para;
    const spoken = body.replace(/\([^)]*\)/g, ' ');
    if (!ProseCleanup.FIRST_PERSON.test(spoken) && !ProseCleanup.ADDRESS.test(spoken.trim())) return para;
    const parts = body.trim().split(/(\([^)]*\))/).map((part) => part.trim()).filter(Boolean);
    return m[1] + ' ' + parts.map((part) => (part.startsWith('(') ? part.slice(1, -1).trim() : '"' + part + '"')).join(' ');
  }

  static _paragraph(para) {
    let p = para.replace(/^[ \t]{0,3}#{1,6}[ \t]+/, '');
    if (ProseCleanup.NOTE_LABEL.test(p)) p = p.replace(ProseCleanup.NOTE_LABEL, '');
    return p;
  }
}

module.exports = ProseCleanup;

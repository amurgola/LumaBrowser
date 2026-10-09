class SpeakerNames {
  static NAME_IN_BOLD = /^\*\*\s*([^*\n:]{1,40}?)\s*:\s*\*\*/;
  static NAME_THEN_COLON = /^\*\*\s*([^*\n:]{1,40}?)\s*\*\*\s*:/;

  static parse(content) {
    const names = [];
    const seen = new Set();
    for (const para of String(content || '').split(/\n{2,}/)) {
      const n = SpeakerNames._speaker(para.trim());
      if (!n || seen.has(n.toLowerCase())) continue;
      seen.add(n.toLowerCase());
      names.push(n);
    }
    return names;
  }

  static _speaker(paragraph) {
    const m = paragraph.match(SpeakerNames.NAME_IN_BOLD) || paragraph.match(SpeakerNames.NAME_THEN_COLON);
    return m ? m[1].trim() : '';
  }
}

module.exports = SpeakerNames;

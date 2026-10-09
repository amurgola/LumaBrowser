class EditProfiles {
  static DEFAULT_MAX_REFERENCES = 3;

  static REF_TAGS = {
    word: (n) => `image ${n}`,
    angle: (n) => `<image${n}>`,
  };

  static GENERIC_PROFILE = {
    refTag: 'word', maxReferences: EditProfiles.DEFAULT_MAX_REFERENCES, keepClause: false, presizeRefs: false, refArea: 0,
  };

  static PROFILES = {
    'qwen-image-2': {
      refTag: 'angle',
      maxReferences: EditProfiles.DEFAULT_MAX_REFERENCES,
      keepClause: true,
      presizeRefs: true,
      refArea: 512 * 1024,
    },
    'qwen-image-edit': { refTag: 'word', maxReferences: EditProfiles.DEFAULT_MAX_REFERENCES, keepClause: false },
    'flux-kontext': { refTag: 'word', maxReferences: EditProfiles.DEFAULT_MAX_REFERENCES, keepClause: false },
  };

  static REF_MENTION = /<\s*(?:image|img|picture)\s*_?\s*(\d{1,2})\s*>|\b(?:image|picture|photo|figure)\s*#?\s*(\d{1,2})\b/gi;

  static QUOTED = /("[^"\n]*"|“[^”\n]*”)/;

  static HAS_KEEP = /\b(?:keep(?:s|ing)?|preserv(?:e|es|ing)|unchanged|maintain(?:s|ing)?|retain(?:s|ing)?)\b/i;

  static editProfileFor(family) {
    const profile = family && EditProfiles.PROFILES[family];
    return profile ? { ...EditProfiles.GENERIC_PROFILE, ...profile, family } : null;
  }

  static tagFor(style) {
    return EditProfiles.REF_TAGS[style] || EditProfiles.REF_TAGS.word;
  }

  static normalizeRefTags(prompt, { style = 'word', count = 0 } = {}) {
    const text = EditProfiles._toText(prompt);
    if (!(count >= 2)) return text;
    return text.split(EditProfiles.QUOTED)
      .map((part, i) => (i % 2 === 1 ? part : EditProfiles._rewriteMentions(part, style, count)))
      .join('');
  }

  static referencePreamble(refs, style = 'word') {
    const tag = EditProfiles.tagFor(style);
    const cap = (s) => (style === 'angle' ? s : EditProfiles._capitalize(s));
    const lines = [`${cap(tag(1))} is the picture being edited.`];
    (refs || []).forEach((ref, i) => {
      lines.push(`${cap(tag(i + 2))} is a reference${ref && ref.use ? ` for the ${ref.use}` : ''}.`);
    });
    return lines.join(' ');
  }

  static keepClause({ style = 'word', count = 1 } = {}) {
    if (!(count >= 2)) return 'Keep everything that was not asked to change exactly as it is in the image.';
    return `Keep everything that was not asked to change exactly as it is in ${EditProfiles.tagFor(style)(1)}. `
      + 'Whatever is taken from another image keeps the exact identity and design it has there.';
  }

  static applyEditProfile(prompt, { family = null, refCount = 0 } = {}) {
    const profile = EditProfiles.editProfileFor(family);
    const text = EditProfiles._toText(prompt);
    if (!profile || !(refCount >= 1)) return text;
    const out = EditProfiles.normalizeRefTags(text, { style: profile.refTag, count: refCount }).trim();
    if (!profile.keepClause || EditProfiles.HAS_KEEP.test(out)) return out;
    const stop = /[.!?]$/.test(out) ? '' : '.';
    return `${out}${stop} ${EditProfiles.keepClause({ style: profile.refTag, count: refCount })}`;
  }

  static _rewriteMentions(part, style, count) {
    const tag = EditProfiles.tagFor(style);
    return part.replace(EditProfiles.REF_MENTION, (mention, tagNumber, wordNumber) => {
      const n = Number(tagNumber || wordNumber);
      if (!(n >= 1 && n <= count)) return mention;
      const out = tag(n);
      return (style !== 'angle' && /^[A-Z]/.test(mention)) ? EditProfiles._capitalize(out) : out;
    });
  }

  static _capitalize(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  static _toText(value) {
    return String(value == null ? '' : value);
  }
}

module.exports = EditProfiles;

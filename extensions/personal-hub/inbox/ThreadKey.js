class ThreadKey {
  static MAX_LENGTH = 120;
  static PREFIX_RE = /^(?:(?:re|fw|fwd|aw|wg|sv|tr)\s*(?:\[\d+\])?\s*:\s*)+/i;
  static BRACKET_RE = /\[[^\]]*\]/g;

  static normalize(text) {
    let s = String(text == null ? '' : text).toLowerCase();
    s = s.replace(ThreadKey.BRACKET_RE, ' ');
    s = s.trim().replace(ThreadKey.PREFIX_RE, '');
    s = s.replace(/\s+/g, ' ').trim();
    return s.length > ThreadKey.MAX_LENGTH ? s.slice(0, ThreadKey.MAX_LENGTH) : s;
  }

  static fromParts(...parts) {
    return parts.map((part) => ThreadKey.normalize(part)).filter(Boolean).join('|');
  }
}

module.exports = ThreadKey;

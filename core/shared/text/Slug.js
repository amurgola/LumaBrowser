class Slug {
  static from(name, { fallback = '', maxLength = 0, separator = '-' } = {}) {
    const sep = String(separator || '-');
    const edgeSeparators = Slug._edgeSeparatorPattern(sep);
    const slug = Slug._replaceIllegal(name, sep).replace(edgeSeparators, '');
    return Slug._truncate(slug, maxLength, edgeSeparators) || fallback;
  }

  static _replaceIllegal(name, sep) {
    return String(name == null ? '' : name).toLowerCase().replace(/[^a-z0-9]+/g, sep);
  }

  static _edgeSeparatorPattern(sep) {
    const escaped = sep.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`^(?:${escaped})+|(?:${escaped})+$`, 'g');
  }

  static _truncate(slug, maxLength, edgeSeparators) {
    if (!(maxLength > 0) || slug.length <= maxLength) return slug;
    return slug.slice(0, maxLength).replace(edgeSeparators, '');
  }
}

module.exports = Slug;

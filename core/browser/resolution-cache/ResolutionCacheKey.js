class ResolutionCacheKey {
  static KIND_GROUPS = {
    click: 'click', locate: 'click',
    type: 'input', fill: 'input', presskey: 'input',
    wait: 'find', getelement: 'find', scroll: 'find',
  };

  static UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  static of(url, description, kind) {
    const page = ResolutionCacheKey.urlPattern(url);
    const desc = ResolutionCacheKey.description(description);
    if (!page || !desc) return null;
    return `${page}|${ResolutionCacheKey.kind(kind)}|${desc}`;
  }

  static urlPattern(url) {
    let parsed;
    try { parsed = new URL(String(url || '')); } catch { return null; }
    if (!/^(https?|file):$/.test(parsed.protocol)) return null;
    const segments = parsed.pathname.split('/').filter(Boolean).map((s) => (ResolutionCacheKey.isIdSegment(s) ? ':id' : s));
    const origin = parsed.protocol === 'file:' ? 'file://' : parsed.origin;
    return `${origin}/${segments.join('/')}`;
  }

  static description(description) {
    return String(description || '')
      .normalize('NFKC')
      .toLowerCase()
      .replace(/["'`‘’“”]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/[.!?,;:]+$/, '')
      .replace(/^(please )?(click|tap|press|find|locate)( on)? /, '')
      .replace(/^(the|a|an) /, '')
      .trim();
  }

  static kind(kind) {
    const k = String(kind || 'click').toLowerCase().replace(/[^a-z]/g, '');
    return ResolutionCacheKey.KIND_GROUPS[k] || k || 'click';
  }

  static isIdSegment(segment) {
    if (/^\d+$/.test(segment)) return true;
    if (ResolutionCacheKey.UUID.test(segment)) return true;
    if (/^[0-9a-f]{8,}$/i.test(segment) && /\d/.test(segment)) return true;
    return ResolutionCacheKey._isOpaqueToken(segment);
  }

  static _isOpaqueToken(segment) {
    if (!/^[A-Za-z0-9_-]{10,}$/.test(segment)) return false;
    const digits = (segment.match(/\d/g) || []).length;
    return digits >= 2 && /[A-Za-z]/.test(segment) && !/^[a-z]+(-[a-z]+)+$/.test(segment);
  }
}

module.exports = ResolutionCacheKey;

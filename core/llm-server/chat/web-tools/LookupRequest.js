class LookupRequest {
  static MIN_TIMEOUT_MS = 2000;
  static MAX_TIMEOUT_MS = 45000;
  static RESULT_NUMBER = /^#?(\d{1,2})$/;

  static MISSING_TARGET = 'web_search was called without "query" or "url": pass "query" to search the web, or "url" '
    + '(a result number or a full address) to read a page.';

  static BAD_PART = '"part" must be a whole number from 1 up (part 1 is the start of the page).';

  static parse(params) {
    const p = params || {};
    const url = LookupRequest._text(p.url);
    const query = LookupRequest._text(p.query);
    const resultNumber = LookupRequest._resultNumber(p, url);
    const part = LookupRequest._part(p.part);
    if (!url && resultNumber == null && !query) return { problem: LookupRequest.MISSING_TARGET };
    if (part == null) return { problem: LookupRequest.BAD_PART };
    return {
      kind: url || resultNumber != null ? 'read' : 'search',
      query,
      url: resultNumber != null ? '' : url,
      resultNumber,
      find: LookupRequest._text(p.find),
      part,
      timeoutMs: LookupRequest._timeout(p.timeout),
    };
  }

  static _text(value) {
    return typeof value === 'string' ? value.trim() : '';
  }

  static _resultNumber(params, url) {
    const raw = LookupRequest.RESULT_NUMBER.test(url) ? url : (params.link ?? params.result ?? null);
    const match = raw == null ? null : LookupRequest.RESULT_NUMBER.exec(String(raw).trim());
    return match ? Number(match[1]) : null;
  }

  static _part(value) {
    if (value == null || value === '') return 1;
    const n = Number(value);
    return Number.isInteger(n) && n >= 1 ? n : null;
  }

  static _timeout(value) {
    if (!Number.isFinite(value)) return undefined;
    return Math.min(Math.max(value, LookupRequest.MIN_TIMEOUT_MS), LookupRequest.MAX_TIMEOUT_MS);
  }
}

module.exports = LookupRequest;

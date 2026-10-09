class HtmlEntityDecoder {
  static ENTITY = /&(#[xX]?[0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]*);/g;

  static NAMED_ENTITIES = {
    amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', copy: '©',
    reg: '®', trade: '™', hellip: '…', mdash: '\u2014', ndash: '–',
    lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”', middot: '·',
    bull: '•', deg: '°', euro: '€', pound: '£', cent: '¢',
    sect: '§', para: '¶', laquo: '«', raquo: '»', times: '×',
    divide: '÷', frac12: '½', frac14: '¼', frac34: '¾',
  };

  static decode(text) {
    return String(text).replace(HtmlEntityDecoder.ENTITY, HtmlEntityDecoder._decodeReference);
  }

  static _decodeReference(match, body) {
    if (body[0] === '#') return HtmlEntityDecoder._decodeNumeric(match, body);
    const named = HtmlEntityDecoder.NAMED_ENTITIES;
    return Object.prototype.hasOwnProperty.call(named, body) ? named[body] : match;
  }

  static _decodeNumeric(match, body) {
    const isHex = body[1] === 'x' || body[1] === 'X';
    const code = isHex ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10);
    if (!Number.isFinite(code) || code <= 0) return match;
    try { return String.fromCodePoint(code); } catch (_) { return match; }
  }
}

module.exports = HtmlEntityDecoder;

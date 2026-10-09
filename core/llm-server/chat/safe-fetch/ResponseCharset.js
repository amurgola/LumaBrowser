class ResponseCharset {
  static CHARSET = /charset\s*=\s*["']?([\w-]+)/i;
  static ENCODINGS = {
    'utf-8': 'utf8',
    utf8: 'utf8',
    'us-ascii': 'utf8',
    ascii: 'utf8',
    'iso-8859-1': 'latin1',
    latin1: 'latin1',
    'windows-1252': 'latin1',
    cp1252: 'latin1',
    'utf-16': 'utf16le',
    'utf-16le': 'utf16le',
    utf16le: 'utf16le',
  };

  static encodingFor(contentType) {
    const match = ResponseCharset.CHARSET.exec(contentType || '');
    const charset = (match ? match[1] : 'utf-8').toLowerCase();
    return ResponseCharset.ENCODINGS[charset] || 'utf8';
  }
}

module.exports = ResponseCharset;

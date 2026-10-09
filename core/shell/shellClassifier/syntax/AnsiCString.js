class AnsiCString {
  static SIMPLE = Object.freeze({
    a: '\x07', b: '\b', e: '\x1b', E: '\x1b', f: '\f', n: '\n', r: '\r', t: '\t', v: '\v',
    '\\': '\\', "'": "'", '"': '"', '?': '?',
  });

  static NUMERIC = Object.freeze({
    x: { digits: /[0-9A-Fa-f]/, max: 2, radix: 16 },
    u: { digits: /[0-9A-Fa-f]/, max: 4, radix: 16 },
    U: { digits: /[0-9A-Fa-f]/, max: 8, radix: 16 },
  });

  static OCTAL = { digits: /[0-7]/, max: 3, radix: 8 };

  static opensAt(cursor) {
    return cursor.startsWith("$'");
  }

  static read(cursor) {
    cursor.take(2);
    let text = '';
    while (!cursor.atEnd && cursor.peek() !== "'") {
      text += cursor.peek() === '\\' ? AnsiCString._readEscape(cursor) : cursor.take();
    }
    cursor.take();
    return text;
  }

  static _readEscape(cursor) {
    cursor.take();
    const ch = cursor.peek();
    if (Object.prototype.hasOwnProperty.call(AnsiCString.SIMPLE, ch)) return AnsiCString.SIMPLE[cursor.take()];
    if (AnsiCString.NUMERIC[ch]) return AnsiCString._readNumber(cursor, AnsiCString.NUMERIC[cursor.take()], `\\${ch}`);
    if (AnsiCString.OCTAL.digits.test(ch)) return AnsiCString._readNumber(cursor, AnsiCString.OCTAL, '\\');
    if (ch === 'c' && cursor.peek(1) !== '') return AnsiCString._readControl(cursor);
    return `\\${cursor.take()}`;
  }

  static _readNumber(cursor, form, literal) {
    let digits = '';
    while (digits.length < form.max && form.digits.test(cursor.peek())) digits += cursor.take();
    if (!digits) return literal;
    return String.fromCodePoint(parseInt(digits, form.radix) % 0x110000);
  }

  static _readControl(cursor) {
    cursor.take();
    return String.fromCharCode(cursor.take().charCodeAt(0) & 0x1f);
  }
}

module.exports = AnsiCString;

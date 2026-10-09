const ch = (...codes) => String.fromCharCode(...codes);

export default class SpeechText {
  static SINGLE_QUOTES = new RegExp('[' + ch(0x2018, 0x2019, 0x02bc) + ']', 'g');
  static DOUBLE_QUOTES = new RegExp('[' + ch(0x201c, 0x201d) + ']', 'g');
  static DASHES = new RegExp('[' + ch(0x2013, 0x2014) + ']', 'g');
  static ELLIPSIS = new RegExp(ch(0x2026), 'g');
  static SYMBOLS = new RegExp('[' + ch(0x2190) + '-' + ch(0x27bf) + ch(0x2b00) + '-' + ch(0x2bff) + ch(0xfe0f)
    + '\\u{1f000}-\\u{1fbff}]', 'gu');

  static clean(s) {
    return String(s)
      .replace(/^\s*\|.*\|\s*$/gm, '')
      .replace(/`([^`]*)`/g, '$1')
      .replace(/\*\*?|__|~~/g, '')
      .replace(/^#+\s*/gm, '')
      .replace(/^\s*[-*+]\s+/gm, '')
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      .replace(/https?:\/\/(www\.)?/gi, '')
      .replace(SpeechText.SINGLE_QUOTES, "'")
      .replace(SpeechText.DOUBLE_QUOTES, '"')
      .replace(SpeechText.DASHES, ', ')
      .replace(SpeechText.ELLIPSIS, '...')
      .replace(SpeechText.SYMBOLS, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
}

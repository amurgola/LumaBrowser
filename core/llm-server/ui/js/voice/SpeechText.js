const cp = (...codes) => String.fromCodePoint(...codes);
const range = (from, to) => cp(from) + '-' + cp(to);

export default class SpeechText {
  static MIN_CHUNK_CHARS = 24;

  static SINGLE_QUOTES = new RegExp('[' + cp(0x2018, 0x2019, 0x02BC) + ']', 'g');
  static DOUBLE_QUOTES = new RegExp('[' + cp(0x201C, 0x201D) + ']', 'g');
  static LONG_DASHES = new RegExp('[' + cp(0x2013, 0x2014) + ']', 'g');
  static ELLIPSIS = new RegExp(cp(0x2026), 'g');
  static SYMBOLS = new RegExp('[' + range(0x2190, 0x27BF) + range(0x2B00, 0x2BFF) + cp(0xFE0F) + range(0x1F000, 0x1FBFF) + ']', 'gu');

  static clean(text) {
    return text
      .replace(/^\s*\|.*\|\s*$/gm, '')
      .replace(/`([^`]*)`/g, '$1')
      .replace(/\*\*?|__|~~/g, '')
      .replace(/^#+\s*/gm, '')
      .replace(/^\s*[-*+]\s+/gm, '')
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      .replace(/https?:\/\/(www\.)?/gi, '')
      .replace(SpeechText.SINGLE_QUOTES, "'")
      .replace(SpeechText.DOUBLE_QUOTES, '"')
      .replace(SpeechText.LONG_DASHES, ', ')
      .replace(SpeechText.ELLIPSIS, '...')
      .replace(SpeechText.SYMBOLS, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  static splitSentences(text) {
    const chunks = [];
    const re = /[.!?]+[\s"')\]]*\s+|\n\n+/g;
    let consumed = 0;
    let m;
    while ((m = re.exec(text)) !== null) {
      const end = m.index + m[0].length;
      const candidate = text.slice(consumed, end);
      if (candidate.trim().length < SpeechText.MIN_CHUNK_CHARS) continue;
      const spoken = SpeechText.clean(candidate);
      if (spoken) chunks.push(spoken);
      consumed = end;
    }
    return { chunks, rest: text.slice(consumed) };
  }

  static speakableChunks(text) {
    const prose = String(text || '')
      .replace(/<think>[\s\S]*?<\/think>/gi, '')
      .replace(/<think>[\s\S]*$/i, '')
      .replace(/<tool_call>[\s\S]*?<\/tool_call>/gi, '')
      .replace(/```[\s\S]*?(?:```|$)/g, '\n');
    const { chunks, rest } = SpeechText.splitSentences(prose);
    const tail = SpeechText.clean(rest);
    if (tail) chunks.push(tail);
    return chunks;
  }
}

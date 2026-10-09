const TokenSizeLabel = require('../outline/TokenSizeLabel');

class TruncationNotice {
  static SPILL_BYTES_PER_TOKEN = 3;

  static build(shownLines, measured, strategy, spilled = null) {
    const where = strategy === 'tail' ? 'last' : 'first';
    if (spilled) return TruncationNotice._spilled(where, shownLines, measured, spilled);
    const more = strategy === 'head' ? ` Use offset=${shownLines + 1} to read further.` : '';
    return `[Output truncated: showing ${where} ${shownLines} of ${measured.totalLines} lines `
      + `(${TruncationNotice._kb(measured.totalBytes)} total).${more}]`;
  }

  static _spilled(where, shownLines, measured, spilled) {
    const tokens = TokenSizeLabel.format(Math.ceil(measured.totalBytes / TruncationNotice.SPILL_BYTES_PER_TOKEN));
    const how = spilled.readable
      ? ' Use read_file or grep on that path for the rest.'
      : ' Re-run with a narrower query if you need the rest.';
    return `[Output truncated: showing ${where} ${shownLines} of ${measured.totalLines} lines. `
      + `Full output (${TruncationNotice._kb(measured.totalBytes)}, ~${tokens} tokens) saved to ${spilled.displayPath}.${how}]`;
  }

  static _kb(bytes) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
}

module.exports = TruncationNotice;

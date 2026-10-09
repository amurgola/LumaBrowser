const ScannedArgs = require('./ScannedArgs');

class OptionGrammar {
  static GETOPT = 'getopt';
  static WORDS = 'words';
  static SLASH = 'slash';
  static POWERSHELL = 'powershell';

  constructor({ style = OptionGrammar.GETOPT, valueShort = '', valueLong = [], valueWords = [], abbreviatesLong = false } = {}) {
    this.style = style;
    this.valueShort = new Set(valueShort);
    this.valueLong = Object.freeze([...valueLong]);
    this.valueWords = new Set(valueWords);
    this.abbreviatesLong = abbreviatesLong;
    Object.freeze(this);
  }

  scan(args) {
    const scanned = new ScannedArgs();
    const words = (args || []).map((arg) => String(arg == null ? '' : arg));
    for (let i = 0; i < words.length; i++) {
      if (this._endsOptions(words[i])) {
        words.slice(i + 1).forEach((word) => scanned.addOperand(word));
        break;
      }
      i += this._read(words[i], words[i + 1], scanned);
    }
    return scanned;
  }

  namesLong(given, full) {
    return given === full || (this.abbreviatesLong && given.length > 0 && full.startsWith(given));
  }

  _endsOptions(word) {
    return word === '--' && this.style !== OptionGrammar.POWERSHELL;
  }

  _read(word, next, scanned) {
    if (this._isLong(word)) return this._readLong(word, next, scanned);
    if (this._isParameter(word)) return this._readParameter(word, scanned);
    if (this._isWord(word)) return this._readWord(word, next, scanned);
    if (this._isBundle(word)) return this._readBundle(word, next, scanned);
    scanned.addOperand(word);
    return 0;
  }

  _isLong(word) {
    const longStyles = [OptionGrammar.GETOPT, OptionGrammar.WORDS];
    return longStyles.includes(this.style) && word.startsWith('--') && word.length > 2;
  }

  _isParameter(word) {
    return this.style === OptionGrammar.POWERSHELL && word.startsWith('-') && word.length > 1;
  }

  _isWord(word) {
    if (this.style === OptionGrammar.WORDS) return word.startsWith('-') && word.length > 1;
    return this.style === OptionGrammar.SLASH && /^[/-]./.test(word);
  }

  _isBundle(word) {
    return this.style === OptionGrammar.GETOPT && word.startsWith('-') && word.length > 1;
  }

  _readLong(word, next, scanned) {
    const body = word.slice(2);
    const equals = body.indexOf('=');
    const given = equals === -1 ? body : body.slice(0, equals);
    const name = this._canonicalLong(given);
    if (equals !== -1) return OptionGrammar._add(scanned, 'long', name, body.slice(equals + 1), `--${given}`, 0);
    const takesNext = this.valueLong.includes(name) && next != null;
    return OptionGrammar._add(scanned, 'long', name, takesNext ? next : null, word, takesNext ? 1 : 0);
  }

  _canonicalLong(given) {
    const matches = this.valueLong.filter((full) => this.namesLong(given, full));
    return matches.length === 1 ? matches[0] : given;
  }

  _readParameter(word, scanned) {
    const colon = word.indexOf(':');
    const name = (colon === -1 ? word.slice(1) : word.slice(1, colon)).toLowerCase();
    return OptionGrammar._add(scanned, 'param', name, colon === -1 ? null : word.slice(colon + 1), word, 0);
  }

  _readWord(word, next, scanned) {
    if (this.style === OptionGrammar.SLASH) return this._readSlashSwitch(word, scanned);
    const takesNext = this.valueWords.has(word) && next != null;
    return OptionGrammar._add(scanned, 'word', word, takesNext ? next : null, word, takesNext ? 1 : 0);
  }

  _readSlashSwitch(word, scanned) {
    const colon = word.indexOf(':');
    const key = (colon === -1 ? word.slice(1) : word.slice(1, colon)).toLowerCase();
    return OptionGrammar._add(scanned, 'word', `/${key}`, colon === -1 ? null : word.slice(colon + 1), word, 0);
  }

  _readBundle(word, next, scanned) {
    const letters = word.slice(1);
    for (let i = 0; i < letters.length; i++) {
      const letter = letters[i];
      if (!this.valueShort.has(letter)) {
        scanned.addOption('short', letter, null, `-${letter}`);
        continue;
      }
      const attached = letters.slice(i + 1);
      if (attached) return OptionGrammar._add(scanned, 'short', letter, attached, `-${letter}`, 0);
      return OptionGrammar._add(scanned, 'short', letter, next != null ? next : null, `-${letter}`, next != null ? 1 : 0);
    }
    return 0;
  }

  static _add(scanned, form, name, value, spelling, consumed) {
    scanned.addOption(form, name, value, spelling);
    return consumed;
  }
}

module.exports = OptionGrammar;

const ShellWords = require('../../ShellWords');

class ToolArgs {
  static OPTION_SHAPE = /^-{1,2}([^-=:][^=:]*)(?:[=:]([\s\S]*))?$/;

  constructor(args) {
    this.raw = (Array.isArray(args) ? args : []).map((arg) => String(arg == null ? '' : arg));
    this.text = this.raw.join(' ');
    this._options = [];
    this._words = [];
    this._read();
  }

  get words() {
    return this._words.map((word) => word.text);
  }

  get spelledWords() {
    return this._words.map((word) => word.spelled);
  }

  hasOption(...names) {
    return this._named(names).length > 0;
  }

  hasShortFlag(letter) {
    return ShellWords.hasShortFlag(this.raw, letter);
  }

  valuesOf(...names) {
    return this._named(names).map((option) => option.value).filter((value) => value !== null);
  }

  inlineValuesOf(...names) {
    return this._named(names).filter((option) => option.inline).map((option) => ShellWords.lower(option.value));
  }

  pathStarts() {
    const starts = [];
    for (let i = 0; i < this._words.length; i++) {
      starts.push(i);
      if (!this._words[i].followsOption) break;
    }
    return starts;
  }

  _named(names) {
    return this._options.filter((option) => names.includes(option.name));
  }

  _read() {
    let afterOption = false;
    let endOfOptions = false;
    this.raw.forEach((arg, index) => {
      const option = endOfOptions ? null : this._parseOption(arg, index);
      if (arg === '--') endOfOptions = true;
      else if (option) this._options.push(option);
      else if (arg) this._words.push({ text: ShellWords.lower(arg), spelled: arg, followsOption: afterOption });
      afterOption = Boolean(option) && option.inline === false;
    });
  }

  _parseOption(arg, index) {
    const match = ToolArgs.OPTION_SHAPE.exec(arg);
    if (!match) return null;
    const inline = match[2] !== undefined;
    return { name: ShellWords.lower(match[1]), value: inline ? match[2] : this._followingValue(index), inline };
  }

  _followingValue(index) {
    const next = this.raw[index + 1];
    return next !== undefined && next !== '' && !next.startsWith('-') ? next : null;
  }
}

module.exports = ToolArgs;

class SedScript {
  static PLAIN_COMMANDS = new Set(['{', '}', '=', 'd', 'D', 'F', 'g', 'G', 'h', 'H', 'n', 'N', 'p', 'P', 'x', 'z']);
  static NUMBER_COMMANDS = new Set(['l', 'L', 'q', 'Q']);
  static LABEL_COMMANDS = new Set(['b', 't', 'T', ':', 'v']);
  static TEXT_COMMANDS = new Set(['a', 'i', 'c']);
  static READ_COMMANDS = new Set(['r', 'R']);
  static SUBSTITUTE_FLAGS = /[gpiImMe0-9w]/;

  static hazardIn(script) {
    return new SedScript(String(script == null ? '' : script))._firstHazard();
  }

  constructor(text) {
    this.text = text;
    this.pos = 0;
  }

  _firstHazard() {
    while (this._skipSeparators()) {
      if (!this._skipAddresses()) return 'has an address this rule cannot read';
      const hazard = this._command(this.text[this.pos++]);
      if (hazard) return hazard;
    }
    return null;
  }

  _skipSeparators() {
    while (this.pos < this.text.length && /[\s;{}!]/.test(this.text[this.pos])) this.pos++;
    if (this.text[this.pos] === '#') { this._restOfLine(); return this._skipSeparators(); }
    return this.pos < this.text.length;
  }

  _skipAddresses() {
    if (!this._skipAddress()) return false;
    if (this.text[this.pos] === ',') {
      this.pos++;
      if (!this._skipAddress()) return false;
    }
    while (/[\s!]/.test(this.text[this.pos] || '')) this.pos++;
    return this.pos < this.text.length;
  }

  _skipAddress() {
    const char = this.text[this.pos];
    if (/[0-9$+~]/.test(char || '')) { while (/[0-9$+~]/.test(this.text[this.pos] || '')) this.pos++; return true; }
    if (char === '/') { this.pos++; return this._skipDelimited('/') && this._skipRegexFlags(); }
    if (char === '\\') { const delimiter = this.text[this.pos + 1]; this.pos += 2; return delimiter != null && this._skipDelimited(delimiter) && this._skipRegexFlags(); }
    return true;
  }

  _skipRegexFlags() {
    while (/[IM]/.test(this.text[this.pos] || '')) this.pos++;
    return true;
  }

  _command(name) {
    if (name === 'w' || name === 'W') return `script command ${name} writes a file`;
    if (name === 'e') return 'script command e runs a shell command';
    if (name === 's') return this._substitute();
    if (name === 'y') return this._transliterate();
    if (SedScript.PLAIN_COMMANDS.has(name)) return null;
    if (SedScript.NUMBER_COMMANDS.has(name)) return this._skipWhile(/[\s0-9]/);
    if (SedScript.LABEL_COMMANDS.has(name)) return this._skipUntil(/[;\n]/);
    if (SedScript.TEXT_COMMANDS.has(name)) return this._text();
    if (SedScript.READ_COMMANDS.has(name)) return this._restOfLine();
    return `script has a command this rule cannot verify (${name})`;
  }

  _substitute() {
    const delimiter = this.text[this.pos++];
    if (delimiter == null || delimiter === '\n' || delimiter === '\\') return 'script has a malformed s command';
    if (!this._skipDelimited(delimiter) || !this._skipDelimited(delimiter)) return 'script has an unterminated s command';
    return this._substituteFlags();
  }

  _substituteFlags() {
    while (SedScript.SUBSTITUTE_FLAGS.test(this.text[this.pos] || '')) {
      const flag = this.text[this.pos++];
      if (flag === 'w') return 'script flag s///w writes a file';
      if (flag === 'e') return 'script flag s///e runs the pattern space as a shell command';
    }
    return null;
  }

  _transliterate() {
    const delimiter = this.text[this.pos++];
    if (delimiter == null || delimiter === '\n' || delimiter === '\\') return 'script has a malformed y command';
    if (!this._skipDelimited(delimiter) || !this._skipDelimited(delimiter)) return 'script has an unterminated y command';
    return null;
  }

  _text() {
    while (this.pos < this.text.length) {
      const newline = this.text.indexOf('\n', this.pos);
      const end = newline === -1 ? this.text.length : newline;
      const continues = this.text[end - 1] === '\\' && newline !== -1;
      this.pos = end + 1;
      if (!continues) break;
    }
    return null;
  }

  _skipDelimited(delimiter) {
    while (this.pos < this.text.length) {
      const char = this.text[this.pos++];
      if (char === '\\') { this.pos++; continue; }
      if (char === delimiter) return true;
    }
    return false;
  }

  _skipWhile(pattern) {
    while (pattern.test(this.text[this.pos] || '')) this.pos++;
    return null;
  }

  _skipUntil(pattern) {
    while (this.pos < this.text.length && !pattern.test(this.text[this.pos])) this.pos++;
    return null;
  }

  _restOfLine() {
    return this._skipUntil(/\n/);
  }
}

module.exports = SedScript;

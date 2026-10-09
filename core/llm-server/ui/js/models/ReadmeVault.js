export default class ReadmeVault {
  static NUL = String.fromCharCode(0);

  static TOKEN = new RegExp(ReadmeVault.NUL + 'B(\\d+)' + ReadmeVault.NUL, 'g');

  static TOKEN_LINE = new RegExp('^' + ReadmeVault.NUL + 'B\\d+' + ReadmeVault.NUL + '$');

  static MAX_PASSES = 5;

  constructor() {
    this._items = [];
  }

  stash(html) {
    return ReadmeVault.NUL + 'B' + (this._items.push(html) - 1) + ReadmeVault.NUL;
  }

  static isTokenLine(line) {
    return ReadmeVault.TOKEN_LINE.test(line);
  }

  restore(html) {
    let out = html;
    for (let pass = 0; pass < ReadmeVault.MAX_PASSES && ReadmeVault._hasToken(out); pass++) {
      out = out.replace(ReadmeVault.TOKEN, (_m, n) => this._items[Number(n)] || '');
    }
    return out;
  }

  static _hasToken(html) {
    ReadmeVault.TOKEN.lastIndex = 0;
    const found = ReadmeVault.TOKEN.test(html);
    ReadmeVault.TOKEN.lastIndex = 0;
    return found;
  }
}

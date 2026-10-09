class FenceExampleStripper {
  static MAX_BLOCK_LINES = 40;
  static BLOCK_START = /\{\s*"tool"\s*:/;

  static strip(doc) {
    const kept = new FenceExampleStripper()._dropClosedBlocks(String(doc || '').split('\n'));
    return FenceExampleStripper._tidy(kept.join('\n'));
  }

  constructor() {
    this._out = [];
    this._held = [];
    this._depth = 0;
    this._inBlock = false;
  }

  _dropClosedBlocks(lines) {
    for (const line of lines) {
      if (!this._inBlock && FenceExampleStripper.BLOCK_START.test(line)) this._openBlock();
      if (this._inBlock) this._holdLine(line);
      else this._out.push(line);
    }
    if (this._inBlock) this._releaseHeld();
    return this._out;
  }

  _openBlock() {
    this._inBlock = true;
    this._depth = 0;
    this._held = [];
  }

  _holdLine(line) {
    this._held.push(line);
    this._depth += FenceExampleStripper._braceBalance(line);
    if (this._depth <= 0) this._discardHeld();
    else if (this._held.length >= FenceExampleStripper.MAX_BLOCK_LINES) this._releaseHeld();
  }

  _discardHeld() {
    this._held = [];
    this._inBlock = false;
  }

  _releaseHeld() {
    this._out.push(...this._held);
    this._discardHeld();
  }

  static _braceBalance(line) {
    let balance = 0;
    for (const ch of line) {
      if (ch === '{') balance++;
      else if (ch === '}') balance--;
    }
    return balance;
  }

  static _tidy(text) {
    return text
      .replace(/[ \t]*Params:[ \t]*$/gm, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }
}

module.exports = FenceExampleStripper;

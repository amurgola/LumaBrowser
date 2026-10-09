class TextPager {
  static BREAK_LOOKBACK_SHARE = 0.25;
  static BREAKS = ['\n\n', '\n', ' '];

  constructor(text, partChars) {
    this._text = String(text || '');
    this._partChars = Math.max(1, Math.floor(partChars));
    this._bounds = this._boundaries();
  }

  count() {
    return this._bounds.length;
  }

  totalChars() {
    return this._text.length;
  }

  part(n) {
    const bound = Number.isInteger(n) ? this._bounds[n - 1] : null;
    if (!bound) return null;
    return { number: n, count: this.count(), ...bound, totalChars: this._text.length, text: this._text.slice(bound.start, bound.end).trim() };
  }

  partAt(offset) {
    const index = this._bounds.findIndex((bound) => offset < bound.end);
    return index === -1 ? this.count() : index + 1;
  }

  _boundaries() {
    const bounds = [];
    let start = 0;
    do {
      const end = this._partEnd(start);
      bounds.push({ start, end });
      start = end;
    } while (start < this._text.length);
    return bounds;
  }

  _partEnd(start) {
    const limit = start + this._partChars;
    if (limit >= this._text.length) return this._text.length;
    const earliest = limit - Math.floor(this._partChars * TextPager.BREAK_LOOKBACK_SHARE);
    for (const mark of TextPager.BREAKS) {
      const at = this._text.lastIndexOf(mark, limit - mark.length);
      if (at >= earliest && at > start) return at + mark.length;
    }
    return limit;
  }
}

module.exports = TextPager;

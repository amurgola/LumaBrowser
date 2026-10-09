const StreamedOutputItem = require('./StreamedOutputItem');

class StreamedTextItem extends StreamedOutputItem {
  static CONTENT_INDEX = 0;

  static DELTA_EVENT = null;

  static DONE_EVENT = null;

  constructor(options) {
    super(options);
    this.text = '';
  }

  append(fragment) {
    this.text += fragment;
    this._emit(this.constructor.DELTA_EVENT, { ...this._partWhere(), delta: fragment });
  }

  _part(text) {
    throw new Error(`${this.constructor.name} must implement _part(text)`);
  }

  _opened() {
    this._emit('response.content_part.added', { ...this._partWhere(), part: this._part('') });
  }

  _closing() {
    this._emit(this.constructor.DONE_EVENT, { ...this._partWhere(), text: this.text });
    this._emit('response.content_part.done', { ...this._partWhere(), part: this._part(this.text) });
  }

  _partWhere() {
    return { ...this._where(), content_index: StreamedTextItem.CONTENT_INDEX };
  }
}

module.exports = StreamedTextItem;

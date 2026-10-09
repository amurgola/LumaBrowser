const OutputItems = require('./OutputItems');

class StreamedOutputItem {
  constructor({ outputIndex, emit, id }) {
    this.outputIndex = outputIndex;
    this.id = id;
    this._emit = emit;
  }

  open() {
    this._emit('response.output_item.added', { output_index: this.outputIndex, item: this._item(OutputItems.IN_PROGRESS) });
    this._opened();
  }

  append(fragment) {
    throw new Error(`${this.constructor.name} must implement append(fragment)`);
  }

  close() {
    this._closing();
    const item = this._item(OutputItems.COMPLETED);
    this._emit('response.output_item.done', { output_index: this.outputIndex, item });
    return item;
  }

  _item(status) {
    throw new Error(`${this.constructor.name} must implement _item(status)`);
  }

  _opened() {}

  _closing() {}

  _where() {
    return { item_id: this.id, output_index: this.outputIndex };
  }
}

module.exports = StreamedOutputItem;

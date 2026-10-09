const OutputItems = require('./OutputItems');
const ResponsesIds = require('./ResponsesIds');
const StreamedTextItem = require('./StreamedTextItem');

class StreamedMessageItem extends StreamedTextItem {
  static DELTA_EVENT = 'response.output_text.delta';

  static DONE_EVENT = 'response.output_text.done';

  constructor({ outputIndex, emit }) {
    super({ outputIndex, emit, id: ResponsesIds.itemId('msg') });
  }

  _item(status) {
    return OutputItems.message(this.id, this.text, status);
  }

  _part(text) {
    return OutputItems.textPart(text);
  }
}

module.exports = StreamedMessageItem;

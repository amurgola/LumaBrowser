const OutputItems = require('./OutputItems');
const ResponsesIds = require('./ResponsesIds');
const StreamedTextItem = require('./StreamedTextItem');

class StreamedReasoningItem extends StreamedTextItem {
  static DELTA_EVENT = 'response.reasoning_text.delta';

  static DONE_EVENT = 'response.reasoning_text.done';

  constructor({ outputIndex, emit }) {
    super({ outputIndex, emit, id: ResponsesIds.itemId('rs') });
  }

  _item() {
    return OutputItems.reasoning(this.id, this.text);
  }

  _part(text) {
    return OutputItems.reasoningPart(text);
  }
}

module.exports = StreamedReasoningItem;

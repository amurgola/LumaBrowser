const OutputItems = require('./OutputItems');
const ResponsesIds = require('./ResponsesIds');
const StreamedOutputItem = require('./StreamedOutputItem');

class StreamedToolCallItem extends StreamedOutputItem {
  constructor({ outputIndex, emit, call, customTools }) {
    super({ outputIndex, emit, id: ResponsesIds.itemId('fc') });
    this.callId = String((call && call.id) || ResponsesIds.callId());
    this.name = String((call && call.function && call.function.name) || '');
    this.args = '';
    this._custom = !!customTools && customTools.has(this.name);
    this._customTools = customTools;
  }

  append(fragment) {
    this.args += fragment;
    if (!this._custom) this._emit('response.function_call_arguments.delta', { ...this._where(), delta: fragment });
  }

  _item(status) {
    return OutputItems.toolCall({ id: this.id, callId: this.callId, name: this.name, args: this.args, customTools: this._customTools, status });
  }

  _closing() {
    if (this._custom) {
      this._emit('response.custom_tool_call_input.done', { ...this._where(), input: OutputItems.customInput(this.args) });
    } else {
      this._emit('response.function_call_arguments.done', { ...this._where(), name: this.name, arguments: this.args });
    }
  }
}

module.exports = StreamedToolCallItem;

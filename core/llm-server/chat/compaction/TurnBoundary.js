const MessageText = require('./MessageText');

class TurnBoundary {
  static TOOL_RESULT_PREFIX = '[Tool Result for ';

  static isTurnStart(message) {
    if (!message || message.role !== 'user') return false;
    return !MessageText.of(message).startsWith(TurnBoundary.TOOL_RESULT_PREFIX);
  }

  static isCutPoint(messages, index, boundary) {
    const message = messages[index];
    if (TurnBoundary.isTurnStart(message)) return true;
    return boundary === 'step' && !!message && message.role === 'assistant';
  }
}

module.exports = TurnBoundary;

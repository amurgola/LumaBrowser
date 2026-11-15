class ThinkingText {
  static BLOCK = /<think>[\s\S]*?<\/think>/gi;

  static strip(text) {
    return String(text == null ? '' : text).replace(ThinkingText.BLOCK, '').trim();
  }
}

module.exports = ThinkingText;

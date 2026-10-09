class MessageText {
  static IMAGE_PLACEHOLDER = '[image]';

  static of(message) {
    const content = message && message.content;
    if (typeof content === 'string') return content;
    if (Array.isArray(content)) return content.map(MessageText._partText).join(' ');
    return '';
  }

  static _partText(part) {
    if (typeof part === 'string') return part;
    if (part && typeof part.text === 'string') return part.text;
    if (part && part.type === 'image_url') return MessageText.IMAGE_PLACEHOLDER;
    return '';
  }
}

module.exports = MessageText;

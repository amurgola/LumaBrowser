class CardText {
  static ELLIPSIS = '…';

  static clip(value, max = 60) {
    const text = String(value == null ? '' : value);
    return text.length > max ? `${text.slice(0, max)}${CardText.ELLIPSIS}` : text;
  }
}

module.exports = CardText;

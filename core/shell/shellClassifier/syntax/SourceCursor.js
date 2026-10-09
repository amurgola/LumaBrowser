class SourceCursor {
  constructor(text, position = 0) {
    this.text = String(text == null ? '' : text);
    this.position = position;
  }

  get atEnd() {
    return this.position >= this.text.length;
  }

  peek(offset = 0) {
    return this.text.charAt(this.position + offset);
  }

  startsWith(fragment) {
    return this.text.startsWith(fragment, this.position);
  }

  take(count = 1) {
    const taken = this.text.slice(this.position, this.position + count);
    this.position += taken.length;
    return taken;
  }

  takeWhile(predicate) {
    const start = this.position;
    while (!this.atEnd && predicate(this.peek())) this.position++;
    return this.sliceFrom(start);
  }

  skipToEnd() {
    this.position = this.text.length;
  }

  sliceFrom(start) {
    return this.text.slice(start, this.position);
  }

  restOfLine() {
    const newline = this.text.indexOf('\n', this.position);
    return this.text.slice(this.position, newline < 0 ? this.text.length : newline);
  }
}

module.exports = SourceCursor;

const HtmlElementCatalog = require('./HtmlElementCatalog');
const HtmlEntityDecoder = require('./HtmlEntityDecoder');

class HtmlTokenizer {
  static MARKUP = /<!--[\s\S]*?(?:-->|$)|<[!?][^>]*>?|<(\/?)([a-zA-Z][a-zA-Z0-9:-]*)((?:[^>"']|"[^"]*"|'[^']*')*)>/g;

  static ATTRIBUTE = /([^\s"'>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;

  static tokenize(html) {
    return new HtmlTokenizer(html).execute();
  }

  constructor(html) {
    this._source = String(html == null ? '' : html);
    this._tokens = [];
  }

  execute() {
    const pattern = new RegExp(HtmlTokenizer.MARKUP.source, 'g');
    let position = 0;
    let match;
    while ((match = pattern.exec(this._source)) !== null) {
      this._pushText(this._source.slice(position, match.index));
      position = this._consumeMarkup(match, pattern);
    }
    this._pushText(this._source.slice(position));
    return this._tokens;
  }

  _consumeMarkup(match, pattern) {
    const [, slash, rawName, rawAttributes] = match;
    if (!rawName) return pattern.lastIndex;
    const name = rawName.toLowerCase();
    if (slash) return this._pushClose(name, pattern.lastIndex);
    const selfClosing = /\/\s*$/.test(rawAttributes);
    this._tokens.push({ type: 'open', name, attributes: HtmlTokenizer._parseAttributes(rawAttributes), selfClosing });
    if (selfClosing || !HtmlElementCatalog.isRawText(name)) return pattern.lastIndex;
    return this._consumeRawText(name, pattern);
  }

  _consumeRawText(name, pattern) {
    const closer = new RegExp(`</${name}\\s*>`, 'ig');
    closer.lastIndex = pattern.lastIndex;
    const found = closer.exec(this._source);
    const end = found ? found.index : this._source.length;
    this._pushText(this._source.slice(pattern.lastIndex, end));
    pattern.lastIndex = found ? closer.lastIndex : this._source.length;
    return this._pushClose(name, pattern.lastIndex);
  }

  _pushClose(name, resumeAt) {
    this._tokens.push({ type: 'close', name });
    return resumeAt;
  }

  _pushText(raw) {
    if (raw) this._tokens.push({ type: 'text', text: HtmlEntityDecoder.decode(raw) });
  }

  static _parseAttributes(raw) {
    const attributes = {};
    const pattern = new RegExp(HtmlTokenizer.ATTRIBUTE.source, 'g');
    let match;
    while ((match = pattern.exec(raw || '')) !== null) {
      const name = match[1].toLowerCase();
      if (Object.prototype.hasOwnProperty.call(attributes, name)) continue;
      attributes[name] = HtmlEntityDecoder.decode(match[2] ?? match[3] ?? match[4] ?? '');
    }
    return attributes;
  }
}

module.exports = HtmlTokenizer;

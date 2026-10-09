const CitationTag = require('./CitationTag');

class PassageCitationRenderer {
  static FENCE = '"""';
  static UNTITLED = 'untitled document';

  static render(passages) {
    return (passages || []).map((passage, position) => PassageCitationRenderer._section(passage, position)).join('\n');
  }

  static _section(passage, position) {
    const fence = PassageCitationRenderer.FENCE;
    const header = `[${CitationTag.at(position)}] ${PassageCitationRenderer._origin(passage)}`;
    return `${header}\n${fence}\n${PassageCitationRenderer._body(passage.text)}\n${fence}`;
  }

  static _origin(passage) {
    const name = PassageCitationRenderer._name(passage.filename);
    return passage.page != null ? `${name}, page ${passage.page}` : name;
  }

  static _name(filename) {
    const clean = String(filename || '').replace(/[[\]]/g, '').replace(/\s+/g, ' ').trim();
    return clean || PassageCitationRenderer.UNTITLED;
  }

  static _body(text) {
    return String(text || '').replace(/"{3,}/g, '""');
  }
}

module.exports = PassageCitationRenderer;

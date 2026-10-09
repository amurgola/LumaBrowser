class CitationTag {
  static PREFIX = 'S';

  static at(position) {
    return `${CitationTag.PREFIX}${position + 1}`;
  }
}

module.exports = CitationTag;

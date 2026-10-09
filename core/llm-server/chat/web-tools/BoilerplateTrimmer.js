class BoilerplateTrimmer {
  static LINK_DENSITY_LIMIT = 0.5;
  static MIN_KEPT_SHARE = 0.2;

  static MARKDOWN_LINK = /!?\[([^\]]*)\]\([^)]*\)/g;

  static trim(markdown) {
    const text = String(markdown || '');
    const blocks = text.split(/\n{2,}/);
    const first = BoilerplateTrimmer._firstContentIndex(blocks);
    const last = BoilerplateTrimmer._lastContentIndex(blocks, first);
    const kept = blocks.slice(first, last + 1).join('\n\n').trim();
    if (!kept || kept.length < text.trim().length * BoilerplateTrimmer.MIN_KEPT_SHARE) return { text: text.trim(), trimmedBlocks: 0 };
    return { text: kept, trimmedBlocks: blocks.length - (last + 1 - first) };
  }

  static isFurniture(block) {
    const linkChars = BoilerplateTrimmer._linkLabelChars(block);
    if (!linkChars) return false;
    const visibleChars = BoilerplateTrimmer._visibleChars(block);
    return linkChars / Math.max(visibleChars, 1) >= BoilerplateTrimmer.LINK_DENSITY_LIMIT;
  }

  static _firstContentIndex(blocks) {
    let i = 0;
    while (i < blocks.length && BoilerplateTrimmer._skippable(blocks[i])) i++;
    return i;
  }

  static _lastContentIndex(blocks, first) {
    let i = blocks.length - 1;
    while (i >= first && BoilerplateTrimmer._skippable(blocks[i])) i--;
    return i;
  }

  static _skippable(block) {
    return !block.trim() || BoilerplateTrimmer.isFurniture(block);
  }

  static _linkLabelChars(block) {
    let chars = 0;
    for (const match of block.matchAll(BoilerplateTrimmer.MARKDOWN_LINK)) chars += match[1].replace(/\s+/g, '').length;
    return chars;
  }

  static _visibleChars(block) {
    return block.replace(BoilerplateTrimmer.MARKDOWN_LINK, '$1').replace(/[\s*_#>|`-]+/g, '').length;
  }
}

module.exports = BoilerplateTrimmer;

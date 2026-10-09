class ArtifactRetryContent {
  static MAX_ARTIFACT_CHARS = 6000;
  static MAX_LIVE_FIELD_CHARS = 4000;

  static forArtifact(src) {
    const c = String((src && src.content) || '');
    const title = (src && src.title) || 'artifact';
    const type = (src && src.type) || 'artifact';
    const max = ArtifactRetryContent.MAX_ARTIFACT_CHARS;
    if (c.length <= max) {
      return `\n\nCURRENT content of "${title}" (${type}); copy an exact "find" from this:\n`
        + `<<<ARTIFACT\n${c}\nARTIFACT>>>`;
    }
    return `\n\nCURRENT content of "${title}" (${type}), first ${max} of ${c.length} chars; `
      + `copy an exact "find" from a region you can see here:\n`
      + `<<<ARTIFACT\n${c.slice(0, max)}\n…(truncated)\nARTIFACT>>>`;
  }

  static forLiveModule(title, html, js) {
    return `\n\nCURRENT live module "${title || 'module'}": copy an exact "find" from the html or js below:\n`
      + `<<<HTML\n${ArtifactRetryContent._clip(html)}\nHTML>>>\n`
      + `<<<JS\n${ArtifactRetryContent._clip(js)}\nJS>>>`;
  }

  static _clip(s) {
    const str = String(s || '');
    const max = ArtifactRetryContent.MAX_LIVE_FIELD_CHARS;
    return str.length <= max ? str : `${str.slice(0, max)}\n[clipped: showing ${max} of ${str.length} characters]`;
  }
}

module.exports = ArtifactRetryContent;

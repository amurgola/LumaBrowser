class ArtAuditPrompt {
  static SYSTEM = 'You are an ART QA INSPECTOR for generated character images. Examine the attached image and answer with ONE JSON object only: no prose, no markdown fences.';

  static messages(item, char) {
    const outfitDesc = ArtAuditPrompt._outfitDesc(item, char);
    return [
      { role: 'system', content: ArtAuditPrompt.SYSTEM },
      {
        role: 'user',
        content: 'This image is supposed to be ' + ArtAuditPrompt._expected(item) + (char && char.name ? ' (' + char.name + ')' : '') + '.\n'
          + (outfitDesc ? 'The character should be wearing: "' + outfitDesc + '".\n' : '')
          + 'Answer with exactly this JSON shape:\n'
          + ArtAuditPrompt._shape(outfitDesc),
      },
    ];
  }

  static _expected(item) {
    return item.kind === 'avatar'
      ? 'a head-and-shoulders PORTRAIT of exactly one character'
      : 'a FULL-BODY reference of exactly one character, shown once, standing on a flat solid chroma-key green background';
  }

  static _outfitDesc(item, char) {
    const outfit = item.kind === 'outfit' && char && Array.isArray(char.outfits)
      ? char.outfits.find((o) => o && o.id === item.outfitId)
      : null;
    return ((outfit && (outfit.desc || outfit.name)) || '').trim();
  }

  static _shape(outfitDesc) {
    return '{"people": <count of separate figures/depictions of a person, counting every duplicate, mini figure, extra panel or floating head>,'
      + ' "character_sheet": <true if it shows MULTIPLE views/crops of the same character in one image, e.g. a large bust plus a small full body>,'
      + ' "flat_green_background": <true if the entire background is one flat solid green>,'
      + ' "damaged": <true if part of the character is missing or replaced by flat colour patches, e.g. hair or clothing areas filled with solid background green, holes in the figure, a partly erased body>,'
      + (outfitDesc
        ? ' "wrong_clothing": <true if the clothing clearly contradicts the stated outfit, e.g. a white blouse painted as a dark shirt, trousers instead of a skirt; minor styling differences are fine>,'
        : '')
      + ' "problems": "<short phrase or empty>"}';
  }
}

module.exports = ArtAuditPrompt;

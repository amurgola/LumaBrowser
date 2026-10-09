const CharacterLooks = require('../world/CharacterLooks');

class EditPromptParts {
  static CHROMA_BG = 'The entire background is one perfectly FLAT, SOLID, UNIFORM chroma-key green'
    + ' (bright green screen, RGB 0 177 64), a plain empty green backdrop and NOTHING else behind the'
    + ' subject: no room, no wall, no floor, no scenery, no outdoors, no nature, no trees, no plants, no'
    + ' leaves, no foliage, no grass, no bushes, no bamboo, no garden, no sky, no shadows on the'
    + ' background, no gradient, no texture; just flat green.';
  static CHROMA_REMINDER = 'Remember: the background is flat solid chroma-key green only.';
  static PROPORTIONS = 'realistic adult human body proportions, a normal-sized head about one-eighth of the full standing height, shoulders and torso in proportion to the head, long legs, a tall slender grown-up figure';
  static CAMERA = 'photographed straight-on at eye level, the camera directly in front of the subject at chest height, a flat even full-length front view';

  static styleAnchor(data) {
    const style = (data && data.style && String(data.style).trim()) || '';
    return (style ? `Art style: ${style}. ` : '')
      + 'Match the art style, medium, line work and colour palette of the reference image EXACTLY: '
      + 'the same kind of hand-drawn stylised 2D illustration, the same soft muted colours, '
      + 'the same gentle contrast, the same flat matte cel shading as the reference. '
      + 'do NOT convert it into a real photograph.';
  }

  static preserveIdentity(char) {
    return 'Keep the EXACT same person as the reference: the exact same face, age and skin tone, the exact same EYE COLOUR'
      + EditPromptParts.eyeNote(char) + ', '
      + 'and the exact same hairstyle: the same hair length, the same hair colour, the same shaved side and the same curls, '
      + 'matching the reference face and hair exactly.';
  }

  static eyeNote(char) {
    const ec = CharacterLooks.eyeColor(char);
    return ec ? ' (' + ec + ')' : '';
  }

  static accessoryClause(char, state) {
    const acc = (state && state.accessories) || (char && char.accessories) || null;
    if (!acc) return '';
    const items = [acc.head, acc.face].map((s) => String(s || '').trim()).filter(Boolean);
    if (!items.length) return '';
    return 'Keep their ' + items.join(' and ') + ' exactly as in the reference; do not remove or alter them.';
  }
}

module.exports = EditPromptParts;

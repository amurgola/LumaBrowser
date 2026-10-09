const CharacterLooks = require('../world/CharacterLooks');
const OutfitText = require('../world/OutfitText');
const EditPromptParts = require('./EditPromptParts');

class FigurePrompts {
  static MOMENT_NEGATIVE = 'scenery, background, room, wall, floor, outdoors, forest, trees, plants, leaves, foliage, grass, bamboo, garden, sky, photo, 3d render';

  static fromHead(char) {
    const noun = CharacterLooks.subjectNoun(char);
    const outfit = (char && char.currentOutfitDesc) || '';
    const looks = [char && char.appearance, char && char.description].filter(Boolean).join(', ');
    return [
      'Image 1 is a head-and-shoulders portrait of a ' + noun + '. Draw the COMPLETE character from head to toe: invent the full body, standing, facing the viewer, the whole body fully in frame.',
      EditPromptParts.CAMERA + '.',
      EditPromptParts.PROPORTIONS + '.',
      'Keep the EXACT same face, eye colour' + EditPromptParts.eyeNote(char) + ', hair and features as image 1. Exactly one single person, one head, one face.',
      looks ? 'Character: ' + looks + '.' : '',
      outfit ? 'They are wearing ' + OutfitText.renderDesc(outfit) + '.' : 'Give them a complete, sensible everyday outfit.',
      EditPromptParts.accessoryClause(char),
      'Solid flat chroma-key green background (bright green, RGB 0 177 64), evenly lit.',
      '2D anime illustration style, flat matte cel shading, clean hand-drawn line art, a single flat stylised drawing of one ' + noun + '.',
    ].filter(Boolean).join(' ');
  }

  static moment(char, poseClause, bodyCue) {
    const noun = CharacterLooks.subjectNoun(char);
    return [
      EditPromptParts.CHROMA_BG,
      'In front of that green screen: the ' + noun + ' from image 1, with the exact face, eye colour'
        + EditPromptParts.eyeNote(char) + ' and hair of image 2, '
        + poseClause + (bodyCue ? ', with ' + bodyCue : '') + '.',
      EditPromptParts.PROPORTIONS + ', ' + EditPromptParts.CAMERA + '.',
      'Keep the exact same outfit as image 1, same colors and details, unchanged. Exactly one single person, one head, one face.',
      EditPromptParts.accessoryClause(char),
      'evenly lit, flat matte cel shading.',
      '2D anime illustration, clean hand-drawn line art, a single flat stylised drawing of one ' + noun + '.',
      EditPromptParts.CHROMA_REMINDER,
    ].filter(Boolean).join(' ');
  }
}

module.exports = FigurePrompts;

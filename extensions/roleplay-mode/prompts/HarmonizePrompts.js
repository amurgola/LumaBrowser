const ImagePrompt = require('./ImagePrompt');

class HarmonizePrompts {
  static qwen(names, plural) {
    const s = plural ? 's' : '';
    return 'Blend ' + (plural ? 'these characters' : 'this character')
      + ' naturally into the room: fix lighting, edges and add a soft contact shadow under each. '
      + 'Keep their current pose' + s + ', their face' + s
      + ' from the references, their outfit' + s + ' and this exact background. '
      + 'Keep a clean 2D anime cel-shaded art style with flat anime colors, NOT realistic, NOT 3d, NOT a photo. '
      + 'Show ' + names + ' only; do not add, remove or duplicate anyone.';
  }

  static anima(data, content) {
    return [
      ImagePrompt.build(data, content),
      'one cohesive anime illustration, the characters blended into the environment and RELIT to match the scene\'s lighting and colour temperature, light and shadow falling on them consistently with the room, a soft contact shadow on the floor under each, keep the 2D anime cel-shaded art style',
    ].filter(Boolean).join('. ');
  }

  static animaNegative(presentCount) {
    const dupNeg = presentCount > 1 ? 'a third person, extra people, crowd' : 'duplicate, two people';
    return 'realistic, 3d render, photo, hair ornament, hair flower, hair accessory, deformed, extra limbs, ' + dupNeg;
  }
}

module.exports = HarmonizePrompts;

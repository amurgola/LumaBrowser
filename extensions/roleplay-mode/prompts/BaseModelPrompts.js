class BaseModelPrompts {
  static scene(data, scene) {
    return BaseModelPrompts.tagify([
      data.style,
      'wide establishing shot, empty environment, no people, no humans, scenery, detailed background',
      scene ? [scene.name, scene.description].filter(Boolean).join(': ') : '',
    ].filter(Boolean).join(', '));
  }

  static face(data, char) {
    const subj = [char.appearance, char.description].filter(Boolean).join(', ') || char.name;
    return BaseModelPrompts.tagify(['solo, character portrait, head and shoulders, looking at viewer, facing the camera, front view, detailed face, plain background', data.style, subj]
      .filter(Boolean).join(', '));
  }

  static tagify(str) {
    return String(str || '').toLowerCase().replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
  }
}

module.exports = BaseModelPrompts;

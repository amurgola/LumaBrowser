class SetupArt {
  static PROMPTS = Object.freeze({
    basePrefix: 'character portrait, head and shoulders, detailed face,',
    baseSuffix: 'No clothing, nude shoulders, solid white background.',
    scenePrefix: 'wide establishing shot of an empty environment, no people, scenery,',
    fullBody: 'Image 1 is the face identity reference only. Create a full-body character reference of the same person with realistic adult human body proportions, a normal-sized head about one-eighth of the full standing height, shoulders and torso in proportion to the head, long legs, a tall slender grown-up figure, standing upright. Photograph the whole figure straight-on at eye level, the camera directly in front at chest height, a flat even full-length front view. Show from head to shoes, with the body filling most of the frame. Same face, same eye color, same hairstyle, same hair color, same identity, one single person. Centered, full outfit, solo, solid white background.',
    emotions: Object.freeze({
      happy: 'Image 1 is the base portrait and defines the hairstyle, hair color, face shape, and identity. Preserve identity, but allow the facial expression to change naturally: eyes, eyelids, eyebrows, cheeks, and mouth may move. Make a happy warm smile. If eyes are visible, keep the same eye color. Head and shoulders, solo, plain background.',
      sad: 'Image 1 is the base portrait and defines the hairstyle, hair color, face shape, and identity. Preserve identity, but allow the facial expression to change naturally: eyes, eyelids, eyebrows, cheeks, and mouth may move. Make the expression sad and downcast, with soft frown and lowered eyes. If eyes are visible, keep the same eye color. Head and shoulders, solo, plain background.',
      angry: 'Image 1 is the base portrait and defines the hairstyle, hair color, face shape, and identity. Preserve identity, but allow the facial expression to change strongly: eyes, eyelids, eyebrows, cheeks, and mouth may move. Make the expression clearly angry: furrowed brows, narrowed eyes, hard glare, tense mouth, slight scowl. Not sad, not worried, not smiling. If eyes are visible, keep the same eye color. Head and shoulders, solo, plain background.',
    }),
  });
  static SCENARIO_CONTEXT_MAX = 160;

  static compose(data, char, extra, opts = {}) {
    const withContext = opts.context !== false;
    const withSubject = opts.subject !== false;
    const ctx = String((data && data.scenario) || '').slice(0, SetupArt.SCENARIO_CONTEXT_MAX);
    return SetupArt._join([SetupArt.PROMPTS.basePrefix, (data && data.style) || '', withContext ? ctx : '',
      withSubject ? String((char && char.description) || '') : '', extra || '']);
  }

  static facePrompt(data, char) {
    return SetupArt.compose(data, char, SetupArt.PROMPTS.baseSuffix, { context: true, subject: true });
  }

  static fullBodyPrompt(data, char) {
    return SetupArt.compose(data, char, SetupArt.PROMPTS.fullBody, { context: false, subject: true });
  }

  static emotionPrompt(data, char, emotion) {
    const emotions = SetupArt.PROMPTS.emotions;
    return SetupArt.compose(data, char, emotions[emotion] || emotions.happy, { context: false, subject: false });
  }

  static scenePrompt(data, scene) {
    return SetupArt._join([SetupArt.PROMPTS.scenePrefix, (data && data.style) || '', String((scene && scene.description) || '')]);
  }

  static _join(parts) {
    return parts.map((p) => String(p || '').trim()).filter(Boolean).join(', ');
  }
}

module.exports = SetupArt;

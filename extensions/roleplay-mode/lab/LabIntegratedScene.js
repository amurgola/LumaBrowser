const ImageProfiles = require('../images/ImageProfiles');
const RenderDimensions = require('../images/RenderDimensions');
const IntegratedScenePrompt = require('../prompts/IntegratedScenePrompt');

class LabIntegratedScene {
  static STRENGTH = 0.9;
  static SEED_OFFSET = 991;

  constructor(generateImage) {
    this._generateImage = generateImage;
  }

  async run(data, shot) {
    const char = data.characters && data.characters[0];
    const scene = (data.scenes || []).find((s) => s.id === data.activeSceneId) || (data.scenes || [])[0];
    if (!char || !scene || !(scene.bg && scene.bg.b64)) return null;
    const bodyB64 = LabIntegratedScene._body(data, char);
    if (!bodyB64) return null;
    const faceB64 = char.art && char.art.base && char.art.base.b64;
    const profile = ImageProfiles.resolve(data);
    const dims = RenderDimensions.resolve(data, 'reaction', 768, 1024);
    return this._generateImage({
      label: 'integrated-scene',
      modelRef: data.editModel || undefined,
      slot: 'edit',
      prompt: LabIntegratedScene._prompt(shot, !!faceB64),
      negativePrompt: IntegratedScenePrompt.NEGATIVE,
      initImage: scene.bg.b64,
      refImages: [bodyB64, faceB64].filter(Boolean),
      strength: LabIntegratedScene.STRENGTH,
      steps: profile.editSteps,
      sampler: profile.sampler,
      scheduler: profile.scheduler,
      cfgScale: profile.cfgScale,
      seed: Number.isFinite(char.seed) ? char.seed + LabIntegratedScene.SEED_OFFSET : undefined,
      width: dims.width,
      height: dims.height,
    });
  }

  static _body(data, char) {
    const stateChar = data.currentState && Array.isArray(data.currentState.characters)
      ? data.currentState.characters.find((s) => s.charId === char.id)
      : null;
    const outfitId = (stateChar && stateChar.outfitId) || char.currentOutfit;
    const outfit = Array.isArray(char.outfits)
      ? char.outfits.find((o) => o.id === outfitId) || char.outfits[char.outfits.length - 1]
      : null;
    return (outfit && outfit.figure && outfit.figure.b64)
      || (char.figure && char.figure.b64)
      || (char.art && char.art.fullBody && char.art.fullBody.b64);
  }

  static _prompt(shot, hasFace) {
    const pose = (shot && shot.pose) || 'standing naturally';
    const action = (shot && shot.action) || '';
    const framing = (shot && shot.framing) || 'full';
    const framingInstruction = /full|wide/i.test(framing)
      ? `Use ${framing} framing and show the complete body from head to feet.`
      : `Use ${framing} framing with a natural camera crop and anatomically coherent posture.`;
    return [
      'Image 1 is the environment plate. Preserve its architecture, objects, camera angle, composition, and art style.',
      'Add the exact same character from image 2 naturally into that environment.',
      hasFace ? 'Image 3 is the face identity reference; preserve that exact face, hair, eye colour, age, and identity.' : '',
      `Pose the character ${pose}${action ? `, ${action}` : ''}. ${framingInstruction}`,
      'Keep the exact outfit from image 2. Match the scene perspective and lighting, with believable contact shadows and physical placement.',
      'Exactly one character. Do not replace, crop, repaint, or redesign the environment outside the area required to place the character.',
      '2D anime illustration, flat matte cel shading, clean hand-drawn line art.',
    ].filter(Boolean).join(' ');
  }
}

module.exports = LabIntegratedScene;

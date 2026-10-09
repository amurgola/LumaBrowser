const SetupArt = require('../world/SetupArt');
const ImageProfiles = require('../images/ImageProfiles');
const RenderDimensions = require('../images/RenderDimensions');

class LabSetupRunner {
  static SCENE_STEPS = 24;

  constructor(generateImage) {
    this._generateImage = generateImage;
  }

  async run(data) {
    const char = data.characters[0];
    await this._scene(data, data.scenes[0]);
    await this._face(data, char);
    if (char.art && char.art.base && char.art.base.b64) await this._fullBody(data, char);
  }

  async _scene(data, scene) {
    const d = RenderDimensions.resolve(data, 'scene', 768, 512);
    const r = await this._generateImage({
      label: 'setup:scene', modelRef: data.baseModel || undefined,
      prompt: SetupArt.scenePrompt(data, scene),
      steps: LabSetupRunner.SCENE_STEPS,
      ...ImageProfiles.baseModelRecipe(data),
      width: d.width, height: d.height,
    });
    if (r && r.b64) scene.bg = { b64: r.b64, mime: r.mime || 'image/png' };
  }

  async _face(data, char) {
    const d = RenderDimensions.resolve(data, 'portrait', 512, 512);
    const r = await this._generateImage({
      label: 'setup:face', modelRef: data.baseModel || undefined,
      prompt: SetupArt.facePrompt(data, char),
      ...ImageProfiles.baseModelRecipe(data),
      width: d.width, height: d.height,
    });
    char.art = char.art || {};
    if (r && r.b64) char.art.base = { b64: r.b64, mime: r.mime || 'image/png' };
  }

  async _fullBody(data, char) {
    const profile = ImageProfiles.resolve(data);
    const d = RenderDimensions.resolve(data, 'composite', 768, 1152);
    const r = await this._generateImage({
      label: 'setup:fullbody', modelRef: data.editModel || undefined, slot: 'edit',
      prompt: SetupArt.fullBodyPrompt(data, char),
      refImages: [char.art.base.b64],
      steps: profile.editSteps,
      sampler: profile.sampler,
      scheduler: profile.scheduler,
      cfgScale: profile.cfgScale,
      width: d.width, height: d.height,
      snapNative: false,
    });
    if (r && r.b64) char.art.fullBody = { b64: r.b64, mime: r.mime || 'image/png' };
  }
}

module.exports = LabSetupRunner;

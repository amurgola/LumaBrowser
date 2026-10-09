const ImageProfiles = require('../../images/ImageProfiles');
const RoleplayEnv = require('../../images/RoleplayEnv');
const ImageCancellation = require('../../images/ImageCancellation');
const NativeImageTools = require('../../compose/NativeImageTools');
const PaintedBeatPrompt = require('../../prompts/PaintedBeatPrompt');
const EditRender = require('../EditRender');

class PaintedPlate {
  static CLOSE_ZOOM = 0.6;
  static PAINTED_STRENGTH = 0.72;
  static PAINTED_CLOSE_STRENGTH = 0.85;
  static INPAINT_STRENGTH = 0.9;
  static IMG2IMG_STRENGTH = 0.6;

  constructor(chat) {
    this._chat = chat;
  }

  async render(plan, hooks) {
    hooks.turn.progress.say('Painting the moment…');
    const route = PaintedPlate._route(plan);
    const plate = await EditRender.generate(this._chat, this._request(plan, hooks, route));
    ImageCancellation.throwIfCancelled(hooks.abortSeq);
    return { plate, kind: route.kind };
  }

  static _route(plan) {
    const useInpaint = !!(plan.sceneMode === 'inpaint' && plan.sceneBg && !plan.paintedBeat);
    const useImg2img = !!((plan.sceneMode === 'img2img' || plan.paintedBeat) && plan.sceneBg);
    const mask = useInpaint ? NativeImageTools.foregroundMask(plan.width, plan.height) : null;
    const kind = mask ? 'inpaint' : (useImg2img ? (plan.paintedBeat ? 'painted' : 'img2img') : 'txt2img');
    return { useInpaint, useImg2img, mask, kind, init: PaintedPlate._init(plan, useInpaint || useImg2img) };
  }

  static _init(plan, fromScene) {
    let init = fromScene ? plan.sceneBg : undefined;
    if (plan.paintedBeat && init && plan.closeUp) {
      init = NativeImageTools.cropZoom(init, PaintedPlate.CLOSE_ZOOM, plan.width, plan.height) || init;
    }
    return plan.soloPaintedBeat ? undefined : init;
  }

  _request(plan, hooks, route) {
    return {
      label: 'plate',
      modelRef: plan.data.baseModel || undefined,
      ...hooks.turn.progress.feedback('Painting the moment', 'plate'),
      prompt: plan.platePrompt, seed: plan.seed, width: plan.width, height: plan.height,
      ...ImageProfiles.baseModelRecipe(plan.data),
      initImage: route.init,
      mask: route.mask || undefined,
      negativePrompt: plan.soloPaintedBeat ? PaintedBeatPrompt.SOLO_NEGATIVE : undefined,
      strength: PaintedPlate._strength(plan, route),
    };
  }

  static _strength(plan, route) {
    if (!(route.useInpaint || (route.useImg2img && route.init))) return undefined;
    if (plan.paintedBeat) {
      return RoleplayEnv.number('RP_PAINTED_STRENGTH', plan.closeUp ? PaintedPlate.PAINTED_CLOSE_STRENGTH : PaintedPlate.PAINTED_STRENGTH);
    }
    return RoleplayEnv.number('RP_PLATE_STRENGTH', route.mask ? PaintedPlate.INPAINT_STRENGTH : PaintedPlate.IMG2IMG_STRENGTH);
  }
}

module.exports = PaintedPlate;

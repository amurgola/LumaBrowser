const ReactionEmotion = require('../../emotions/ReactionEmotion');
const CharacterArt = require('../../world/CharacterArt');
const HarmonizePrompts = require('../../prompts/HarmonizePrompts');
const ImageProfiles = require('../../images/ImageProfiles');
const RoleplayEnv = require('../../images/RoleplayEnv');
const ImageCancellation = require('../../images/ImageCancellation');
const RpDebug = require('../../images/RpDebug');
const EditRender = require('../EditRender');

class HarmonizePass {
  static QWEN_EXTRA_STRENGTH = 0.05;

  constructor(chat) {
    this._chat = chat;
  }

  applies(plan, plateKind, plate) {
    const profile = ImageProfiles.resolve(plan.data);
    return plateKind === 'composite' && !!(plate && plate.b64) && profile.harmonize && profile.harmonizeStrength > 0;
  }

  async run(plan, plate, hooks) {
    hooks.turn.progress.say('Matching the light…');
    const started = Date.now();
    const profile = ImageProfiles.resolve(plan.data);
    const mode = RoleplayEnv.text('RP_HARMONIZE', 'qwen');
    const { prompt, request } = mode === 'qwen'
      ? this._qwen(plan, plate, profile, hooks)
      : this._anima(plan, plate, profile, hooks);
    const image = await EditRender.generate(this._chat, request);
    ImageCancellation.throwIfCancelled(hooks.abortSeq);
    RpDebug.log('reaction.refine.done', { messageId: hooks.turn.messageId, ok: !!(image && image.b64), ms: Date.now() - started });
    return { image, prompt };
  }

  _qwen(plan, plate, profile, hooks) {
    const plural = plan.present.length > 1;
    const bodyRefs = plan.bodyRefs();
    const refs = plural ? bodyRefs : HarmonizePass._soloRefs(plan, bodyRefs);
    const names = plan.present.map((c) => c && c.name).filter(Boolean).join(' and ') || 'the character';
    const prompt = HarmonizePrompts.qwen(names, plural);
    RpDebug.log('reaction.refine.start', {
      messageId: hooks.turn.messageId, harmonizeMode: 'qwen', editModel: EditRender.modelRef(plan.data),
      plateKind: 'composite', strength: profile.harmonizeStrength, count: plan.present.length,
    });
    return {
      prompt,
      request: {
        label: 'harmonize',
        modelRef: EditRender.modelRef(plan.data),
        slot: 'edit',
        ...hooks.turn.progress.feedback('Matching the light', 'harmonize'),
        prompt,
        initImage: plate.b64,
        refImages: refs,
        strength: profile.harmonizeStrength + HarmonizePass.QWEN_EXTRA_STRENGTH,
        ...ImageProfiles.editRecipe(plan.data),
        width: plan.width,
        height: plan.height,
      },
    };
  }

  static _soloRefs(plan, bodyRefs) {
    const solo = plan.soloEntry;
    const face = CharacterArt.faceRef(solo && solo.char, ReactionEmotion.detect(solo && solo.state, plan.content));
    return [face].filter(Boolean).concat(bodyRefs.slice(0, 1)).slice(0, 2);
  }

  _anima(plan, plate, profile, hooks) {
    const prompt = HarmonizePrompts.anima(plan.data, plan.content);
    RpDebug.log('reaction.refine.start', {
      messageId: hooks.turn.messageId, harmonizeMode: RoleplayEnv.text('RP_HARMONIZE', 'qwen'),
      harmonizeModel: plan.data.baseModel || '(default gen)', plateKind: 'composite', strength: profile.harmonizeStrength,
      masked: false, promptChars: prompt.length, prompt,
    });
    return {
      prompt,
      request: {
        label: 'harmonize',
        modelRef: plan.data.baseModel || undefined,
        ...hooks.turn.progress.feedback('Matching the light', 'harmonize'),
        prompt,
        negativePrompt: HarmonizePrompts.animaNegative(plan.present.length),
        initImage: plate.b64,
        strength: profile.harmonizeStrength,
        steps: profile.harmonizeSteps,
        sampler: profile.sampler,
        scheduler: profile.scheduler,
        seed: plan.seed, width: plan.width, height: plan.height,
      },
    };
  }
}

module.exports = HarmonizePass;

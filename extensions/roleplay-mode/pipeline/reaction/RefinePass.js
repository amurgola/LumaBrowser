const RefinePrompt = require('../../prompts/RefinePrompt');
const ImageProfiles = require('../../images/ImageProfiles');
const RoleplayEnv = require('../../images/RoleplayEnv');
const ImageCancellation = require('../../images/ImageCancellation');
const RpDebug = require('../../images/RpDebug');
const EditRender = require('../EditRender');

class RefinePass {
  static STRENGTH = 0.55;
  static SOLO_REACTION_STRENGTH = 0.3;

  constructor(chat) {
    this._chat = chat;
  }

  applies(plan, plateKind, plate) {
    return plateKind !== 'composite' && plateKind !== 'integrated' && !!(plate && plate.b64) && plan.bodyRefs().length > 0;
  }

  async run(plan, plate, plateKind, hooks) {
    hooks.turn.progress.say('Refining the character' + (plan.present.length > 1 ? 's' : '') + '…');
    const prompt = RefinePrompt.build(plan.data, plan);
    const strength = RoleplayEnv.number('RP_REFINE_STRENGTH', plan.soloPaintedBeat ? RefinePass.SOLO_REACTION_STRENGTH : RefinePass.STRENGTH);
    const refs = plan.bodyRefs();
    RpDebug.log('reaction.refine.start', {
      messageId: hooks.turn.messageId, editModel: EditRender.modelRef(plan.data) || '(default edit)', plateKind,
      refCount: refs.length, strength, promptChars: prompt.length, prompt,
    });
    const started = Date.now();
    const image = await EditRender.generate(this._chat, {
      label: 'refine',
      modelRef: EditRender.modelRef(plan.data),
      slot: 'edit',
      ...hooks.turn.progress.feedback('Refining the character', 'refine'),
      prompt,
      initImage: plate.b64,
      strength,
      refImages: refs,
      ...ImageProfiles.editRecipe(plan.data),
      width: plan.width,
      height: plan.height,
    });
    ImageCancellation.throwIfCancelled(hooks.abortSeq);
    RpDebug.log('reaction.refine.done', { messageId: hooks.turn.messageId, ok: !!(image && image.b64), ms: Date.now() - started });
    return { image, prompt };
  }
}

module.exports = RefinePass;

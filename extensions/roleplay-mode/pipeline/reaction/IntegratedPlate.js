const ReactionEmotion = require('../../emotions/ReactionEmotion');
const IntegratedScenePrompt = require('../../prompts/IntegratedScenePrompt');
const ImageProfiles = require('../../images/ImageProfiles');
const RoleplayEnv = require('../../images/RoleplayEnv');
const ImageCancellation = require('../../images/ImageCancellation');
const RpDebug = require('../../images/RpDebug');
const FigureReplater = require('../../compose/FigureReplater');
const EditRender = require('../EditRender');

class IntegratedPlate {
  static NEUTRAL_PLATE = [235, 235, 235];
  static STRENGTH = 0.9;
  static SEED_OFFSET = 991;

  constructor(chat) {
    this._chat = chat;
  }

  applies(plan) {
    return !!(plan.dynamicBeat && plan.sceneBg && plan.soloEntry && plan.compChar);
  }

  async render(plan, hooks) {
    const { soloEntry, directorShot } = plan;
    const body = (await FigureReplater.tryReplate(plan.compChar, { rgb: IntegratedPlate.NEUTRAL_PLATE })) || plan.compChar;
    const { prompt, negativePrompt } = IntegratedScenePrompt.build(plan.data, {
      char: soloEntry.char, emotion: ReactionEmotion.detect(soloEntry.state, plan.content), directorShot,
    });
    hooks.turn.progress.say('Staging ' + ((soloEntry.char && soloEntry.char.name) || 'the character') + ' in the scene…');
    RpDebug.log('reaction.integrated.start', {
      messageId: hooks.turn.messageId, contact: !!(directorShot && directorShot.contact),
      action: (directorShot && directorShot.action) || null, props: (directorShot && directorShot.props) || [],
      promptChars: prompt.length, prompt,
    });
    const started = Date.now();
    const img = await EditRender.generate(this._chat, this._request(plan, hooks, prompt, negativePrompt, body));
    ImageCancellation.throwIfCancelled(hooks.abortSeq);
    const ok = !!(img && img.b64);
    RpDebug.log('reaction.integrated.done', { messageId: hooks.turn.messageId, ok, ms: Date.now() - started });
    return ok ? { plate: img, prompt } : null;
  }

  _request(plan, hooks, prompt, negativePrompt, body) {
    return {
      label: 'integrated-scene',
      modelRef: EditRender.modelRef(plan.data),
      slot: 'edit',
      ...hooks.turn.progress.feedback('Staging the moment', 'integrated'),
      prompt,
      negativePrompt,
      initImage: plan.sceneBg,
      refImages: [body],
      strength: RoleplayEnv.number('RP_INTEGRATED_STRENGTH', IntegratedPlate.STRENGTH),
      ...ImageProfiles.editRecipe(plan.data),
      seed: Number.isFinite(plan.seed) ? plan.seed + IntegratedPlate.SEED_OFFSET : undefined,
      width: plan.width,
      height: plan.height,
    };
  }
}

module.exports = IntegratedPlate;

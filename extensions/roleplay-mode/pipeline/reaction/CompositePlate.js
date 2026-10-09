const ReactionEmotion = require('../../emotions/ReactionEmotion');
const CharacterArt = require('../../world/CharacterArt');
const ImageCancellation = require('../../images/ImageCancellation');
const RpDebug = require('../../images/RpDebug');
const SceneCompositor = require('../../compose/SceneCompositor');
const MomentFigureRenderer = require('../MomentFigureRenderer');

class CompositePlate {
  static SPREAD = 0.24;
  static COMPOSE_OPTS = {
    bodyThr: 95, bodyErode: 2, globalKey: true, despill: true,
    lightingMatch: true, lightingStrength: 0.22,
  };

  constructor(chat, { figures = null } = {}) {
    this._figures = figures || new MomentFigureRenderer(chat);
  }

  async render(plan, hooks) {
    const entries = plan.compositeEntries();
    if (!entries.length) return null;
    try {
      const figs = await this._figuresFor(plan, entries, hooks);
      if (!figs.length) return null;
      const composed = await SceneCompositor.composeFigures(plan.sceneBg, figs, CompositePlate.composeOpts(plan));
      if (!(composed && composed.plateB64)) return null;
      hooks.turn.progress.stage('plate', composed.plateB64, 'image/png');
      RpDebug.log('reaction.figure.composed', { messageId: hooks.turn.messageId, pose: plan.pose.key, figH: plan.pose.figH, count: figs.length });
      return { b64: composed.plateB64, mime: 'image/png' };
    } catch (e) {
      if (e && e.code === ImageCancellation.CODE) throw e;
      RpDebug.log('reaction.figure.compose.error', { messageId: hooks.turn.messageId, error: (e && e.message) || 'compose failed' });
      return null;
    }
  }

  static composeOpts(plan) {
    return Object.assign({ W: plan.width, H: plan.height }, CompositePlate.COMPOSE_OPTS);
  }

  async _figuresFor(plan, entries, hooks) {
    const group = entries.length > 1;
    const offsets = SceneCompositor.spreadOffsets(entries.length, CompositePlate.SPREAD);
    const figs = [];
    for (let i = 0; i < entries.length; i += 1) {
      const entry = entries[i];
      hooks.turn.progress.say('Posing ' + ((entry.char && entry.char.name) || 'the character') + '…');
      const emotion = ReactionEmotion.detect(entry.state, plan.content);
      const baseBody = CharacterArt.bodyRefForState(entry.char, entry.state);
      const bodyB64 = await this._figures.ensure(plan.data, entry.char, plan.pose, emotion, baseBody, hooks);
      ImageCancellation.throwIfCancelled(hooks.abortSeq);
      if (bodyB64) figs.push({ b64: bodyB64, dx: group ? offsets[i] : 0, figH: plan.figureHeight(group) });
    }
    return figs;
  }
}

module.exports = CompositePlate;

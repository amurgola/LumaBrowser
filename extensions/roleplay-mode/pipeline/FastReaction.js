const RpDebug = require('../images/RpDebug');
const RoleplayEnv = require('../images/RoleplayEnv');
const ReactionEmotion = require('../emotions/ReactionEmotion');
const SceneCompositor = require('../compose/SceneCompositor');
const MomentFigureRenderer = require('./MomentFigureRenderer');
const ReactionPlan = require('./reaction/ReactionPlan');
const CompositePlate = require('./reaction/CompositePlate');
const ReactionStore = require('./reaction/ReactionStore');

class FastReaction {
  static async tryRender({ data, content, directorShot, sig, turn }) {
    try {
      if (RoleplayEnv.sceneMode() !== 'composite') return false;
      const plan = new ReactionPlan(data, content, directorShot);
      if (!plan.sceneBg || !plan.momentEntries.length) return false;
      const figs = FastReaction._cachedFigures(plan);
      if (!figs) return false;
      const started = Date.now();
      const composed = await SceneCompositor.composeFigures(plan.sceneBg, figs, CompositePlate.composeOpts(plan));
      if (!(composed && composed.plateB64)) return false;
      await FastReaction._ship(plan, composed.plateB64, sig, turn);
      RpDebug.log('reaction.fast', { messageId: turn.messageId, count: figs.length, pose: plan.pose.key, ms: Date.now() - started });
      return true;
    } catch (e) {
      RpDebug.log('reaction.fast.error', { messageId: turn.messageId, error: e && e.message });
      return false;
    }
  }

  static _cachedFigures(plan) {
    const entries = plan.momentEntries;
    const group = entries.length > 1;
    const offsets = SceneCompositor.spreadOffsets(entries.length, CompositePlate.SPREAD);
    const figs = [];
    for (let i = 0; i < entries.length; i += 1) {
      const emotion = ReactionEmotion.detect(entries[i].state, plan.content);
      const b64 = MomentFigureRenderer.cached(entries[i].char, entries[i].state, plan.pose, emotion);
      if (!b64) {
        RpDebug.log('reaction.fast.miss', { char: entries[i].char && entries[i].char.name, pose: plan.pose.key, emotion });
        return null;
      }
      figs.push({ b64, dx: group ? offsets[i] : 0, figH: plan.figureHeight(group) });
    }
    return figs;
  }

  static async _ship(plan, plateB64, sig, turn) {
    turn.emit('mode:image-start', { messageId: turn.messageId });
    const img = { b64: plateB64, mime: 'image/png' };
    ReactionStore.record(plan.data, turn.messageId, img, {
      prompt: plan.animaPrompt, shot: plan.shot, sceneId: plan.sceneId, width: plan.width, height: plan.height,
      plateKind: 'composite-cached',
    });
    if (sig) ReactionStore.anchor(plan.data, turn.messageId, sig, false);
    await ReactionStore.publish(turn, plan.data, img);
  }
}

module.exports = FastReaction;

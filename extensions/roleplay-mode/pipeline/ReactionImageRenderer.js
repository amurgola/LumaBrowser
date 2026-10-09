const RpDebug = require('../images/RpDebug');
const ReactionEmotion = require('../emotions/ReactionEmotion');
const NativeComposite = require('../compose/NativeComposite');
const EditRender = require('./EditRender');
const EmotionFaceRenderer = require('./EmotionFaceRenderer');
const ReactionPlan = require('./reaction/ReactionPlan');
const IntegratedPlate = require('./reaction/IntegratedPlate');
const CompositePlate = require('./reaction/CompositePlate');
const PaintedPlate = require('./reaction/PaintedPlate');
const HarmonizePass = require('./reaction/HarmonizePass');
const RefinePass = require('./reaction/RefinePass');
const ReactionStore = require('./reaction/ReactionStore');

class ReactionImageRenderer {
  constructor(chat) {
    this._faces = new EmotionFaceRenderer(chat);
    this._integrated = new IntegratedPlate(chat);
    this._composite = new CompositePlate(chat);
    this._painted = new PaintedPlate(chat);
    this._harmonize = new HarmonizePass(chat);
    this._refine = new RefinePass(chat);
  }

  async render({ data, content, directorShot, sig, turn, abortSeq }) {
    const hooks = { turn, abortSeq };
    const plan = new ReactionPlan(data, content, directorShot);
    ReactionImageRenderer._logStart(plan, turn);
    await this._faces.refresh(data, plan.momentEntries, content, hooks);
    turn.emit('mode:image-start', { messageId: turn.messageId });
    const built = await this._plate(plan, hooks);
    const finished = await this._finish(plan, built, hooks);
    await ReactionImageRenderer._deliver(plan, built, finished, sig, turn);
  }

  async _plate(plan, hooks) {
    RpDebug.log('reaction.plate.start', {
      messageId: hooks.turn.messageId, sceneMode: plan.sceneMode, fromSceneBg: !!plan.sceneBg,
      compCount: plan.compositeEntries().length, painted: plan.paintedBeat,
      action: (plan.directorShot && plan.directorShot.action) || null, props: (plan.directorShot && plan.directorShot.props) || [],
      promptChars: plan.platePrompt.length, prompt: plan.platePrompt,
    });
    const started = Date.now();
    const built = await this._firstPlate(plan, hooks);
    RpDebug.log('reaction.plate.done', { messageId: hooks.turn.messageId, ok: !!(built.plate && built.plate.b64), kind: built.plateKind, ms: Date.now() - started });
    if (built.plate && built.plate.b64) RpDebug.image('_plate-' + built.plateKind + '-' + hooks.turn.messageId + '.png', built.plate.b64);
    return built;
  }

  async _firstPlate(plan, hooks) {
    if (this._integrated.applies(plan)) {
      const integrated = await this._integrated.render(plan, hooks);
      if (integrated) return { plate: integrated.plate, plateKind: 'integrated', platePrompt: integrated.prompt };
    }
    const composite = await this._composite.render(plan, hooks);
    if (composite) return { plate: composite, plateKind: 'composite', platePrompt: plan.platePrompt };
    const native = ReactionImageRenderer._nativeComposite(plan);
    if (native) return { plate: native, plateKind: 'composite', platePrompt: plan.platePrompt };
    const painted = await this._painted.render(plan, hooks);
    return { plate: painted.plate, plateKind: painted.kind, platePrompt: plan.platePrompt };
  }

  static _nativeComposite(plan) {
    if (plan.paintedBeat || plan.sceneMode !== 'composite' || !plan.sceneBg || !plan.compChar) return null;
    const b64 = NativeComposite.compose(plan.sceneBg, plan.compChar, plan.width, plan.height);
    return b64 ? { b64, mime: 'image/png' } : null;
  }

  async _finish(plan, { plate, plateKind }, hooks) {
    let pass = null;
    if (this._harmonize.applies(plan, plateKind, plate)) pass = await this._harmonize.run(plan, plate, hooks);
    else if (this._refine.applies(plan, plateKind, plate)) pass = await this._refine.run(plan, plate, plateKind, hooks);
    if (!pass) return { img: plate, refinePrompt: null };
    if (pass.image && pass.image.b64) {
      RpDebug.image('_refined-' + hooks.turn.messageId + '.png', pass.image.b64);
      return { img: pass.image, refinePrompt: pass.prompt };
    }
    return { img: plate, refinePrompt: pass.prompt };
  }

  static async _deliver(plan, { plate, plateKind, platePrompt }, { img, refinePrompt }, sig, turn) {
    RpDebug.log('reaction.gen.done', { messageId: turn.messageId, ok: !!(img && img.b64), usedRefine: !!(img && plate && img.b64 !== plate.b64), mime: img && img.mime });
    if (!img || !img.b64) {
      RpDebug.log('reaction.image.fail', { messageId: turn.messageId });
      turn.emit('mode:image-fail', { messageId: turn.messageId });
      return;
    }
    ReactionStore.record(plan.data, turn.messageId, img, {
      prompt: plan.animaPrompt, shot: plan.shot, sceneId: plan.sceneId, width: plan.width, height: plan.height,
      plateKind,
      platePrompt: platePrompt !== plan.animaPrompt ? platePrompt : undefined,
      refinePrompt: refinePrompt || undefined,
    });
    ReactionStore.anchor(plan.data, turn.messageId, sig, plan.paintedBeat || plan.dynamicBeat);
    RpDebug.log('reaction.image.emit', { messageId: turn.messageId, bytes: img.b64.length });
    await ReactionStore.publish(turn, plan.data, img);
  }

  static _logStart(plan, turn) {
    RpDebug.log('reaction.start', {
      messageId: turn.messageId,
      chars: plan.present.map((c) => c && c.name),
      emotions: plan.momentEntries.map((e) => ReactionEmotion.detect(e.state, plan.content)),
      sceneId: plan.sceneId, shot: plan.shot,
      hasSceneBg: !!plan.sceneBg,
      baseModel: plan.data.baseModel || '(default gen)',
      editModel: EditRender.modelRef(plan.data) || '(default edit)',
    });
  }
}

module.exports = ReactionImageRenderer;

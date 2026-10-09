const FigurePrompts = require('../prompts/FigurePrompts');
const CharacterLooks = require('../world/CharacterLooks');
const ImageProfiles = require('../images/ImageProfiles');
const RenderDimensions = require('../images/RenderDimensions');
const ImageCancellation = require('../images/ImageCancellation');
const RpDebug = require('../images/RpDebug');
const BackdropProbe = require('../compose/BackdropProbe');
const FigureShapeProbe = require('../compose/FigureShapeProbe');
const FigureReplater = require('../compose/FigureReplater');
const ArtAuditQueue = require('../audit/ArtAuditQueue');
const EditRender = require('./EditRender');
const TurnChannel = require('./TurnChannel');

class FullBodyBuilder {
  static STRENGTH = 0.9;

  constructor(chat, { pause = EditRender.pause } = {}) {
    this._chat = chat;
    this._pause = pause;
  }

  async build(data, char, headB64, hooks = {}) {
    if (!headB64) return null;
    const turn = hooks.turn || new TurnChannel();
    RpDebug.log('reaction.fullbody.start', { char: char && char.name, noun: CharacterLooks.subjectNoun(char), fromHead: true });
    const started = Date.now();
    const rolled = await this._roll(data, char, headB64, turn, hooks.abortSeq);
    if (rolled.cancelled) return null;
    const img = await FullBodyBuilder._replated(await FullBodyBuilder._keepable(rolled));
    RpDebug.log('reaction.fullbody.done', { char: char && char.name, ok: !!(img && img.b64), ms: Date.now() - started });
    if (!(img && img.b64)) return null;
    char.figure = { b64: img.b64, mime: img.mime || 'image/png' };
    ArtAuditQueue.add(data, { kind: 'figure', charId: char.id });
    await turn.trySave(data);
    return img.b64;
  }

  async _roll(data, char, headB64, turn, abortSeq) {
    const profile = ImageProfiles.resolve(data);
    const roll = { img: null, badPlate: null, seedOffset: 0 };
    for (let attempt = 0; attempt < profile.retryAttempts && !(roll.img && roll.img.b64); attempt += 1) {
      let candidate = await EditRender.generate(this._chat, this._request(data, char, headB64, turn, roll.seedOffset));
      if (ImageCancellation.wasCancelled(abortSeq)) return { cancelled: true };
      candidate = await FullBodyBuilder._screen(candidate, roll, char);
      roll.img = candidate;
      if (!(roll.img && roll.img.b64) && attempt + 1 < profile.retryAttempts) {
        await this._pause(profile.retryDelayMs);
      }
    }
    return roll;
  }

  _request(data, char, headB64, turn, seedOffset) {
    const dims = RenderDimensions.resolve(data, 'composite', 768, 1152);
    return {
      label: 'figure',
      modelRef: EditRender.modelRef(data), slot: 'edit',
      ...turn.progress.feedback('Building the character', 'figure'),
      prompt: FigurePrompts.fromHead(char), initImage: headB64, refImages: [headB64],
      seed: Number.isFinite(char && char.seed) ? char.seed + seedOffset : undefined,
      strength: FullBodyBuilder.STRENGTH, ...ImageProfiles.editRecipe(data), width: dims.width, height: dims.height,
      snapNative: false,
    };
  }

  static async _screen(candidate, roll, char) {
    if (candidate && candidate.b64 && roll.seedOffset === 0) {
      const bd = await BackdropProbe.trySample(candidate.b64);
      if (bd && !bd.strictChroma) {
        RpDebug.log('reaction.fullbody.badbackdrop', { char: char && char.name, rgb: bd.rgb });
        roll.badPlate = candidate;
        roll.seedOffset = 1;
        return null;
      }
    }
    if (candidate && candidate.b64) {
      const shape = await FigureShapeProbe.tryProbe(candidate.b64);
      if (shape && !shape.ok) {
        RpDebug.log('reaction.fullbody.badshape', {
          char: char && char.name, fgFrac: shape.fgFrac, cxFrac: shape.cxFrac,
          closeUp: shape.closeUp, tiny: shape.tiny, offside: shape.offside,
        });
        if (roll.seedOffset === 0) roll.seedOffset = 1;
        return null;
      }
    }
    return candidate;
  }

  static async _keepable({ img, badPlate }) {
    if (img && img.b64) return img;
    if (!(badPlate && badPlate.b64)) return badPlate;
    const shape = await FigureShapeProbe.tryProbe(badPlate.b64);
    return (!shape || shape.ok) ? badPlate : null;
  }

  static async _replated(img) {
    if (!(img && img.b64)) return img;
    const b64 = await FigureReplater.tryReplate(img.b64);
    return b64 ? { b64, mime: 'image/png' } : img;
  }
}

module.exports = FullBodyBuilder;

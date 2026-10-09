const PoseCatalog = require('../prompts/PoseCatalog');
const FigurePrompts = require('../prompts/FigurePrompts');
const CharacterArt = require('../world/CharacterArt');
const ImageProfiles = require('../images/ImageProfiles');
const RenderDimensions = require('../images/RenderDimensions');
const RoleplayEnv = require('../images/RoleplayEnv');
const ImageCancellation = require('../images/ImageCancellation');
const RpDebug = require('../images/RpDebug');
const BackdropProbe = require('../compose/BackdropProbe');
const EditRender = require('./EditRender');
const FullBodyBuilder = require('./FullBodyBuilder');
const TurnChannel = require('./TurnChannel');

class MomentFigureRenderer {
  static STRENGTH = 0.9;
  static _CANCELLED = Symbol('cancelled');

  constructor(chat, { pause = EditRender.pause, bodies = null } = {}) {
    this._chat = chat;
    this._pause = pause;
    this._bodies = bodies || new FullBodyBuilder(chat, { pause });
  }

  static cacheKey(char, pose, emotion) {
    const outfitId = (char && char.currentOutfit) || 'default';
    return (pose && pose.key ? pose.key : 'standing') + '|' + outfitId + '|' + (emotion || 'neutral');
  }

  static cached(char, state, pose, emotion) {
    if (!char) return null;
    if (!MomentFigureRenderer._needsRender(pose, emotion)) {
      return CharacterArt.hasFullBody(char) ? CharacterArt.bodyRefForState(char, state) : null;
    }
    const hit = char.art && char.art.figures && char.art.figures[MomentFigureRenderer.cacheKey(char, pose, emotion)];
    return hit && hit.b64 ? hit.b64 : null;
  }

  async ensure(data, char, pose, emotion, baseBodyB64, hooks = {}) {
    if (!baseBodyB64) return baseBodyB64;
    const turn = hooks.turn || new TurnChannel();
    const body = await this._canonicalBody(data, char, baseBodyB64, { turn, abortSeq: hooks.abortSeq });
    if (!MomentFigureRenderer._needsRender(pose, emotion)) return body;
    const cacheKey = MomentFigureRenderer.cacheKey(char, pose, emotion);
    char.art = char.art || {};
    char.art.figures = char.art.figures || {};
    const hit = char.art.figures[cacheKey];
    if (hit && hit.b64) return hit.b64;
    return this._render(data, char, pose, emotion, body, cacheKey, turn, hooks.abortSeq);
  }

  static _needsRender(pose, emotion) {
    return !!((pose && pose.key !== 'standing' && pose.variant) || PoseCatalog.bodyCue(emotion));
  }

  async _canonicalBody(data, char, baseBodyB64, hooks) {
    if (CharacterArt.hasFullBody(char)) return baseBodyB64;
    return (await this._bodies.build(data, char, baseBodyB64, hooks)) || baseBodyB64;
  }

  async _render(data, char, pose, emotion, body, cacheKey, turn, abortSeq) {
    RpDebug.log('reaction.figure.start', { char: char && char.name, pose: pose && pose.key, emotion, outfitId: (char && char.currentOutfit) || 'default' });
    const started = Date.now();
    const img = await this._retry(data, char, pose, emotion, body, turn, abortSeq);
    if (img === MomentFigureRenderer._CANCELLED) return body;
    RpDebug.log('reaction.figure.done', { char: char && char.name, pose: pose && pose.key, emotion, ok: !!(img && img.b64), ms: Date.now() - started });
    if (!(img && img.b64)) return body;
    char.art.figures[cacheKey] = { b64: img.b64, mime: img.mime || 'image/png' };
    await turn.trySave(data);
    return img.b64;
  }


  async _retry(data, char, pose, emotion, body, turn, abortSeq) {
    const profile = ImageProfiles.resolve(data);
    let img = null;
    for (let attempt = 0; attempt < profile.retryAttempts && !(img && img.b64); attempt += 1) {
      img = await EditRender.generate(this._chat, this._request(data, char, pose, emotion, body, turn, attempt));
      if (ImageCancellation.wasCancelled(abortSeq)) return MomentFigureRenderer._CANCELLED;
      if (img && img.b64 && await MomentFigureRenderer._badBackdrop(img.b64, char, pose, attempt)) img = null;
      if (!(img && img.b64) && attempt + 1 < profile.retryAttempts) {
        await this._pause(profile.retryDelayMs);
      }
    }
    return img;
  }

  _request(data, char, pose, emotion, body, turn, attempt) {
    const faceB64 = (emotion && char && char.art && char.art[emotion] && char.art[emotion].b64)
      ? char.art[emotion].b64
      : ((char && char.art && char.art.base && char.art.base.b64) || null);
    const needPose = pose && pose.key !== 'standing' && pose.variant;
    const bodyCue = PoseCatalog.bodyCue(emotion);
    const dims = RenderDimensions.resolve(data, 'composite', 768, 1152);
    return {
      label: 'figure',
      modelRef: EditRender.modelRef(data), slot: 'edit',
      ...turn.progress.feedback('Posing ' + (char.name || 'the character'), 'figure'),
      prompt: FigurePrompts.moment(char, needPose ? pose.variant : 'standing, facing the viewer', bodyCue),
      initImage: body, refImages: [faceB64, body].filter(Boolean),
      negativePrompt: FigurePrompts.MOMENT_NEGATIVE,
      seed: Number.isFinite(char && char.seed) ? char.seed + attempt : undefined,
      strength: bodyCue ? RoleplayEnv.number('RP_EMOTION_STRENGTH', MomentFigureRenderer.STRENGTH) : MomentFigureRenderer.STRENGTH,
      ...ImageProfiles.editRecipe(data, 'figureSteps'),
      width: dims.width, height: dims.height,
      snapNative: false,
    };
  }

  static async _badBackdrop(b64, char, pose, attempt) {
    const backdrop = await BackdropProbe.trySample(b64);
    if (!(backdrop && !backdrop.strictChroma)) return false;
    RpDebug.log('reaction.figure.reject', {
      char: char && char.name, pose: pose && pose.key, attempt, reason: 'non-chroma background', rgb: backdrop.rgb,
    });
    return true;
  }
}

module.exports = MomentFigureRenderer;

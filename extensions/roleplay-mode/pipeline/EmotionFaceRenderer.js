const ReactionEmotion = require('../emotions/ReactionEmotion');
const EmotionReferencePrompt = require('../prompts/EmotionReferencePrompt');
const ImageProfiles = require('../images/ImageProfiles');
const RenderDimensions = require('../images/RenderDimensions');
const RoleplayEnv = require('../images/RoleplayEnv');
const ImageCancellation = require('../images/ImageCancellation');
const RpDebug = require('../images/RpDebug');
const FaceMask = require('../compose/FaceMask');
const EditRender = require('./EditRender');

class EmotionFaceRenderer {
  static MASKED_STRENGTH = 0.42;
  static GENTLE_STRENGTH = 0.3;

  constructor(chat) {
    this._chat = chat;
  }

  async refresh(data, entries, content, hooks) {
    for (const entry of entries) {
      const emotion = ReactionEmotion.detect(entry.state, content);
      const c = entry.char;
      if (!emotion || !c || !c.art || !c.art.base || !c.art.base.b64 || (c.art[emotion] && c.art[emotion].b64)) continue;
      const img = await this._render(data, c, emotion, hooks);
      if (!(img && img.b64)) continue;
      c.art = Object.assign({}, c.art, { [emotion]: { b64: img.b64, mime: img.mime || 'image/png' } });
      await hooks.turn.save(data);
      hooks.turn.announceWorld(data);
    }
  }

  async _render(data, c, emotion, hooks) {
    const dims = RenderDimensions.resolve(data, 'portrait', 512, 512);
    const faceMask = RoleplayEnv.enabled('RP_EMOTION_MASK') ? FaceMask.build(dims.width, dims.height) : null;
    const started = Date.now();
    RpDebug.log('reaction.emotion.gen.start', { char: c.name, emotion, masked: !!faceMask });
    let img = await EditRender.generate(this._chat, this._request(data, c, emotion, dims, hooks, faceMask, 'Drawing ' + emotion + ' expression'));
    ImageCancellation.throwIfCancelled(hooks.abortSeq);
    if (faceMask && !(img && img.b64)) {
      img = await EditRender.generate(this._chat, this._request(data, c, emotion, dims, hooks, null, 'Retrying the expression'));
      ImageCancellation.throwIfCancelled(hooks.abortSeq);
    }
    RpDebug.log('reaction.emotion.gen.done', { char: c.name, emotion, masked: !!faceMask, ok: !!(img && img.b64), ms: Date.now() - started });
    return img;
  }

  _request(data, c, emotion, dims, hooks, mask, label) {
    return {
      label: 'emotion-ref',
      modelRef: EditRender.modelRef(data),
      slot: 'edit',
      ...hooks.turn.progress.feedback(label, 'emotion'),
      prompt: EmotionReferencePrompt.build(c, emotion),
      initImage: c.art.base.b64,
      mask: mask || undefined,
      strength: mask ? EmotionFaceRenderer.MASKED_STRENGTH : EmotionFaceRenderer.GENTLE_STRENGTH,
      ...ImageProfiles.editRecipe(data, 'emotionSteps'),
      seed: Number.isFinite(c.seed) ? c.seed : undefined,
      width: dims.width,
      height: dims.height,
    };
  }
}

module.exports = EmotionFaceRenderer;

const CharacterArt = require('../world/CharacterArt');
const OutfitReferencePrompt = require('../prompts/OutfitReferencePrompt');
const ImageProfiles = require('../images/ImageProfiles');
const RenderDimensions = require('../images/RenderDimensions');
const ImageCancellation = require('../images/ImageCancellation');
const RpDebug = require('../images/RpDebug');
const BackdropProbe = require('../compose/BackdropProbe');
const FigureShapeProbe = require('../compose/FigureShapeProbe');
const FigureReplater = require('../compose/FigureReplater');
const ArtAuditQueue = require('../audit/ArtAuditQueue');
const EditRender = require('./EditRender');
const FullBodyBuilder = require('./FullBodyBuilder');

class OutfitRenderer {
  static ATTEMPTS = 2;

  constructor(chat, { bodies = null } = {}) {
    this._chat = chat;
    this._bodies = bodies || new FullBodyBuilder(chat);
  }

  async render(data, pend, hooks) {
    const c = (data.characters || []).find((x) => x.id === pend.charId);
    const outfit = c && Array.isArray(c.outfits) && c.outfits.find((o) => o && o.id === pend.outfitId);
    if (!c || !outfit) return false;
    const srcRef = await this._identityRef(data, c, pend, hooks);
    if (!srcRef) {
      RpDebug.log('post.outfit.skip', { char: c.name, outfit: outfit.name, reason: 'no identity ref on file' });
      hooks.outcomes.fail('outfit:' + outfit.id);
      return false;
    }
    const result = await this._renderChecked(data, c, outfit, srcRef, pend, hooks);
    if (result.cancelled) return false;
    if (!(result.img && result.img.b64) || result.shapeBad) { hooks.outcomes.fail('outfit:' + outfit.id); return false; }
    hooks.outcomes.ok('outfit:' + outfit.id);
    await this._store(data, c, outfit, result.img, hooks.turn);
    return true;
  }

  async _identityRef(data, c, pend, hooks) {
    let srcRef = pend.sourceRef || CharacterArt.bodyRef(c);
    if (CharacterArt.hasFullBody(c)) return srcRef;
    const headB64 = CharacterArt.headRef(c);
    if (!headB64) return srcRef;
    hooks.turn.progress.say('Casting ' + (c.name || 'the character') + '…');
    const built = await this._bodies.build(data, c, headB64, { turn: hooks.turn, abortSeq: hooks.abortSeq });
    ImageCancellation.throwIfCancelled(hooks.abortSeq);
    if (built) srcRef = built;
    else if (!srcRef) srcRef = headB64;
    return srcRef;
  }

  async _renderChecked(data, c, outfit, srcRef, pend, hooks) {
    const started = Date.now();
    const turn = hooks.turn;
    turn.progress.say('Dressing ' + (c.name || 'the character') + (outfit.name ? ' in ' + outfit.name : '') + '…');
    RpDebug.log('post.outfit.start', { char: c.name, outfit: outfit.name, hasSourceRef: true, bootstrapped: srcRef !== pend.sourceRef });
    const request = this._request(data, c, outfit, srcRef, turn);
    let oimg = null;
    let shapeBad = false;
    for (let attempt = 0; attempt < OutfitRenderer.ATTEMPTS; attempt += 1) {
      const img = await this._chat.generateImage(request);
      if (ImageCancellation.wasCancelled(hooks.abortSeq)) return { cancelled: true };
      if (!(img && img.b64)) break;
      oimg = img;
      const verdict = await OutfitRenderer._inspect(img.b64);
      shapeBad = verdict.shapeBad;
      if (verdict.ok) break;
      OutfitRenderer._logBadPlate(c, outfit, attempt, verdict);
    }
    RpDebug.log('post.outfit.done', { char: c.name, outfit: outfit.name, ok: !!(oimg && oimg.b64), shapeBad, ms: Date.now() - started });
    return { img: oimg, shapeBad };
  }

  _request(data, c, outfit, srcRef, turn) {
    const dims = RenderDimensions.resolve(data, 'composite', 768, 1152);
    return {
      label: 'outfit',
      modelRef: EditRender.modelRef(data),
      slot: 'edit',
      ...turn.progress.feedback('Dressing ' + (c.name || 'the character'), 'outfit'),
      prompt: OutfitReferencePrompt.build(data, c, outfit, true),
      negativePrompt: OutfitReferencePrompt.NEGATIVE,
      refImages: [srcRef],
      ...ImageProfiles.editRecipe(data, 'outfitSteps'),
      width: dims.width, height: dims.height,
      snapNative: false,
    };
  }

  static async _inspect(b64) {
    const backdrop = await BackdropProbe.trySample(b64);
    const shape = await FigureShapeProbe.tryProbe(b64);
    const shapeBad = !!(shape && !shape.ok);
    return { backdrop, shape, shapeBad, ok: (!backdrop || backdrop.strictChroma) && !shapeBad };
  }

  static _logBadPlate(c, outfit, attempt, { backdrop, shape }) {
    RpDebug.log('post.outfit.badplate', {
      char: c.name, outfit: outfit.name, attempt,
      rgb: backdrop && backdrop.rgb,
      strictChroma: !!(backdrop && backdrop.strictChroma),
      shape: shape && { fgFrac: shape.fgFrac, cxFrac: shape.cxFrac, closeUp: shape.closeUp, tiny: shape.tiny, offside: shape.offside },
    });
  }

  async _store(data, c, outfit, oimg, turn) {
    const replated = await FigureReplater.tryReplate(oimg.b64);
    const img = replated ? { b64: replated, mime: 'image/png' } : oimg;
    outfit.b64 = img.b64;
    outfit.mime = img.mime || 'image/png';
    ArtAuditQueue.add(data, { kind: 'outfit', charId: c.id, outfitId: outfit.id });
    await turn.trySave(data);
    turn.announceWorld(data);
  }
}

module.exports = OutfitRenderer;

const BaseModelPrompts = require('../prompts/BaseModelPrompts');
const ImageProfiles = require('../images/ImageProfiles');
const RenderDimensions = require('../images/RenderDimensions');
const ImageCancellation = require('../images/ImageCancellation');
const ArtAuditQueue = require('../audit/ArtAuditQueue');

class AvatarRenderer {
  constructor(chat) {
    this._chat = chat;
  }

  async render(data, faceIds, hooks) {
    for (const id of faceIds) {
      ImageCancellation.throwIfCancelled(hooks.abortSeq);
      const c = data.characters.find((x) => x.id === id);
      if (!c || (c.art && c.art.base)) continue;
      await this._renderOne(data, c, hooks);
    }
  }

  async _renderOne(data, c, hooks) {
    hooks.turn.progress.say('Designing ' + (c.name || 'a new character') + '…');
    const fimg = await this._chat.generateImage({
      label: 'avatar',
      modelRef: data.baseModel || undefined,
      ...hooks.turn.progress.feedback('Designing ' + (c.name || 'the character'), 'avatar'),
      prompt: BaseModelPrompts.face(data, c),
      ...ImageProfiles.baseModelRecipe(data),
      ...RenderDimensions.resolve(data, 'portrait', 512, 512),
    });
    ImageCancellation.throwIfCancelled(hooks.abortSeq);
    if (!(fimg && fimg.b64)) { hooks.outcomes.fail('face:' + c.id); return; }
    hooks.outcomes.ok('face:' + c.id);
    c.art = Object.assign({}, c.art, { base: { b64: fimg.b64, mime: fimg.mime || 'image/png' } });
    ArtAuditQueue.add(data, { kind: 'avatar', charId: c.id });
    await hooks.turn.save(data);
    hooks.turn.announceWorld(data);
  }
}

module.exports = AvatarRenderer;

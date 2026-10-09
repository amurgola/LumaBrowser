const BaseModelPrompts = require('../prompts/BaseModelPrompts');
const ImageProfiles = require('../images/ImageProfiles');
const RenderDimensions = require('../images/RenderDimensions');
const ImageCancellation = require('../images/ImageCancellation');
const RpDebug = require('../images/RpDebug');

class SceneArtRenderer {
  constructor(chat) {
    this._chat = chat;
  }

  async render(data, sceneArtId, hooks) {
    ImageCancellation.throwIfCancelled(hooks.abortSeq);
    const scene = data.scenes.find((s) => s.id === sceneArtId);
    const dims = RenderDimensions.resolve(data, 'scene', 768, 512);
    const started = Date.now();
    hooks.turn.progress.say('Painting ' + ((scene && scene.name) ? 'the ' + scene.name : 'the scene') + '…');
    RpDebug.log('post.sceneart.start', { sceneId: sceneArtId, backfill: sceneArtId !== hooks.newSceneId, baseModel: data.baseModel || '(default)' });
    const simg = await this._chat.generateImage({
      label: 'scene-art',
      modelRef: data.baseModel || undefined,
      ...hooks.turn.progress.feedback('Painting the scene', 'scene'),
      prompt: BaseModelPrompts.scene(data, scene),
      ...ImageProfiles.baseModelRecipe(data),
      width: dims.width,
      height: dims.height,
    });
    ImageCancellation.throwIfCancelled(hooks.abortSeq);
    RpDebug.log('post.sceneart.done', { sceneId: sceneArtId, ok: !!(simg && simg.b64), ms: Date.now() - started });
    if (!(simg && simg.b64 && scene)) { hooks.outcomes.fail('scene:' + sceneArtId); return; }
    await SceneArtRenderer._store(data, scene, simg, hooks);
  }

  static async _store(data, scene, simg, hooks) {
    const mime = simg.mime || 'image/png';
    hooks.outcomes.ok('scene:' + scene.id);
    scene.bg = { b64: simg.b64, mime };
    await hooks.turn.save(data);
    hooks.turn.emit('mode:scene-art', { sceneId: scene.id, b64: simg.b64, mime });
    if (hooks.previewReaction) hooks.turn.progress.stage('scene', simg.b64, mime);
  }
}

module.exports = SceneArtRenderer;

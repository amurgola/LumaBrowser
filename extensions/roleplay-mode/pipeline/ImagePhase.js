const EditRender = require('./EditRender');
const ImageCancellation = require('../images/ImageCancellation');
const SceneArtRenderer = require('./SceneArtRenderer');
const AvatarRenderer = require('./AvatarRenderer');
const OutfitRenderer = require('./OutfitRenderer');
const ReactionImageRenderer = require('./ReactionImageRenderer');

class ImagePhase {
  constructor(chat) {
    this._chat = chat;
    this._scenes = new SceneArtRenderer(chat);
    this._avatars = new AvatarRenderer(chat);
    this._outfits = new OutfitRenderer(chat);
    this._reactions = new ReactionImageRenderer(chat);
  }

  static shouldWarmEdit({ wantReaction, pendingOutfits, wantSceneArt, wantAvatars }) {
    return !!((wantReaction || (pendingOutfits && pendingOutfits.length)) && !wantSceneArt && !wantAvatars);
  }

  async run(job) {
    const abortSeq = ImageCancellation.mark();
    const turn = job.turn;
    if (job.wantReaction) turn.emit('mode:image-start', { messageId: turn.messageId });
    else turn.progress.say('Preparing the scene…');
    await this._chat.beginExclusiveImage();
    try {
      await this._renderAll(job, { turn, outcomes: job.outcomes, abortSeq });
    } finally {
      this._chat.endExclusiveImage();
      if (!job.wantReaction) turn.progress.done();
      if (job.outcomes.dirty) await turn.trySave(job.data);
    }
  }

  async _renderAll(job, hooks) {
    ImageCancellation.throwIfCancelled(hooks.abortSeq);
    this._maybeWarmEdit(job);
    const { data, sweep } = job;
    if (sweep.sceneArtId) {
      await this._scenes.render(data, sweep.sceneArtId, { ...hooks, newSceneId: job.newSceneId, previewReaction: job.wantReaction });
    }
    if (sweep.faceIds.length) await this._avatars.render(data, sweep.faceIds, hooks);
    for (const pend of job.pendingOutfits) {
      ImageCancellation.throwIfCancelled(hooks.abortSeq);
      await this._outfits.render(data, pend, hooks);
      ImageCancellation.throwIfCancelled(hooks.abortSeq);
    }
    if (!job.wantReaction) return;
    ImageCancellation.throwIfCancelled(hooks.abortSeq);
    await this._reactions.render({ data, content: job.content, directorShot: job.directorShot, sig: job.sig, turn: hooks.turn, abortSeq: hooks.abortSeq });
  }

  _maybeWarmEdit(job) {
    const wants = {
      wantReaction: job.wantReaction, pendingOutfits: job.pendingOutfits,
      wantSceneArt: !!job.sweep.sceneArtId, wantAvatars: !!job.sweep.faceIds.length,
    };
    if (!ImagePhase.shouldWarmEdit(wants) || typeof this._chat.warmImageSlot !== 'function') return;
    try { this._chat.warmImageSlot('edit', EditRender.modelRef(job.data)); } catch (_) {}
  }
}

module.exports = ImagePhase;

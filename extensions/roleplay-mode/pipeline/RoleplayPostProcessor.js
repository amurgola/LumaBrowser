const DataMigration = require('../world/DataMigration');
const SpeakerNames = require('../prompts/SpeakerNames');
const ProseCues = require('../prompts/ProseCues');
const RoleplayEnv = require('../images/RoleplayEnv');
const RpDebug = require('../images/RpDebug');
const BeatKind = require('../images/BeatKind');
const ImageCancellation = require('../images/ImageCancellation');
const HostGlobals = require('../HostGlobals');
const ArtAuditor = require('../audit/ArtAuditor');
const StageCall = require('../stage/StageCall');
const StageReconciler = require('../stage/StageReconciler');
const WorldDelta = require('../stage/WorldDelta');
const TurnData = require('./TurnData');
const TurnChannel = require('./TurnChannel');
const AssetOutcomes = require('./AssetOutcomes');
const AssetSweepPlanner = require('./AssetSweepPlanner');
const RenderSignature = require('./RenderSignature');
const FastReaction = require('./FastReaction');
const ImagePhase = require('./ImagePhase');

class RoleplayPostProcessor {
  constructor(chat, logger = null) {
    this._chat = chat;
    this._logger = logger;
    this._auditor = new ArtAuditor(chat);
    this._stage = new StageCall(chat, logger);
    this._images = new ImagePhase(chat);
  }

  async process({ content, assistantMessageId, meta, emit, setMeta }) {
    const turn = new TurnChannel({ emit, setMeta, messageId: assistantMessageId });
    try {
      const data = TurnData.from(meta);
      if (data.options.autoImage) turn.progress.say('Reading the scene…');
      const { delta, directorShot } = await this._reconcile(data, content, TurnData.wasEmpty(meta), turn);
      if (delta.changed) {
        await turn.save(data);
        turn.announceWorld(data, delta.announcement());
      }
      await this._draw(data, content, delta, directorShot, turn);
    } catch (err) {
      if (err && err.code === ImageCancellation.CODE) {
        turn.emit('mode:image-fail', { messageId: assistantMessageId, canceled: true });
        turn.progress.done();
      }
      if (this._logger && this._logger.warn) this._logger.warn('roleplay postProcess failed', { error: err && err.message });
    }
  }

  async _reconcile(data, content, worldEmpty, turn) {
    const delta = new WorldDelta();
    if (DataMigration.migrate(data)) delta.changed = true;
    const heuristicAdded = RoleplayPostProcessor._addSpeakers(data, content, delta);
    await this._audit(data, turn);
    let directorShot = null;
    if (this._wantStage(data, content, heuristicAdded, worldEmpty)) {
      turn.progress.say('Reading the scene…');
      const ex = await this._stage.run(data, content);
      if (ex) {
        directorShot = ex.shot || null;
        StageReconciler.apply(data, ex, delta);
      }
    }
    return { delta, directorShot };
  }

  static _addSpeakers(data, content, delta) {
    let added = false;
    const known = (n) => data.characters.some((c) => c.name && c.name.toLowerCase() === n.toLowerCase());
    for (const n of SpeakerNames.parse(content)) {
      if (known(n)) continue;
      delta.addCharacter(data, { name: n });
      added = true;
    }
    return added;
  }

  async _audit(data, turn) {
    try {
      if (await this._auditor.auditPending(data)) {
        turn.progress.say('Re-checking character art…');
        await turn.save(data);
      }
    } catch (e) {
      RpDebug.log('audit.fatal', { error: e && e.message });
    }
  }

  _wantStage(data, content, heuristicAdded, worldEmpty) {
    return typeof this._chat.complete === 'function'
      && (!!data.options.autoImage || heuristicAdded || ProseCues.movementHint(content) || ProseCues.outfitHint(content) || worldEmpty);
  }

  async _draw(data, content, delta, directorShot, turn) {
    const sweep = AssetSweepPlanner.plan(data, { newCharIds: delta.newCharIds, newSceneId: delta.newSceneId });
    const pendingOutfits = RoleplayPostProcessor._withBackfills(delta.pendingOutfits, sweep.outfitBackfills);
    const reaction = await this._reactionPlan(data, content, directorShot, pendingOutfits, turn);
    RoleplayPostProcessor._logImagePhase(this._chat, turn, delta, sweep, pendingOutfits, reaction);
    if (!this._chat.isImageReady() || !RoleplayPostProcessor._hasWork(sweep, pendingOutfits, reaction.want)) {
      turn.progress.done();
      return;
    }
    await this._images.run({
      data, content, directorShot, sig: reaction.sig, sweep, pendingOutfits,
      wantReaction: reaction.want, newSceneId: delta.newSceneId, turn, outcomes: new AssetOutcomes(data),
    });
  }

  static _withBackfills(pendingOutfits, backfills) {
    for (const b of backfills) {
      if (!pendingOutfits.some((p) => p.outfitId === b.outfitId)) pendingOutfits.push(b);
    }
    return pendingOutfits;
  }

  async _reactionPlan(data, content, directorShot, pendingOutfits, turn) {
    if (!data.options.autoImage) return { want: false, sig: null, plan: 'none' };
    const sig = RenderSignature.of(data, content, directorShot);
    const diffOn = !HostGlobals.lab() && RoleplayEnv.enabled('RP_STATE_DIFF');
    const oneOff = BeatKind.isPainted(directorShot) || BeatKind.isDynamic(directorShot);
    if (diffOn && !oneOff && data.lastRender && data.lastRender.sig === sig && data.lastShot && data.lastShot.b64) {
      RpDebug.log('reaction.skip', { messageId: turn.messageId, sig });
      return { want: false, sig, plan: 'skip' };
    }
    if (diffOn && !oneOff && !pendingOutfits.length
      && await FastReaction.tryRender({ data, content, directorShot, sig, turn })) {
      return { want: false, sig, plan: 'fast' };
    }
    return { want: true, sig, plan: 'full' };
  }

  static _hasWork(sweep, pendingOutfits, wantReaction) {
    return !!(sweep.sceneArtId || sweep.faceIds.length || wantReaction || pendingOutfits.length);
  }

  static _logImagePhase(chat, turn, delta, sweep, pendingOutfits, reaction) {
    RpDebug.log('post.imagephase', {
      messageId: turn.messageId,
      imageReady: chat.isImageReady(),
      wantSceneArt: !!sweep.sceneArtId, wantAvatars: !!sweep.faceIds.length, wantReaction: reaction.want, reactionPlan: reaction.plan,
      newCharIds: delta.newCharIds, newSceneId: delta.newSceneId, sceneChanged: delta.sceneChanged,
      sweepSceneArtId: sweep.sceneArtId, sweepFaceIds: sweep.faceIds,
      sweepOutfits: sweep.outfitBackfills.map((b) => b.outfitId),
      pendingOutfits: pendingOutfits.map((p) => p.charId),
    });
  }
}

module.exports = RoleplayPostProcessor;

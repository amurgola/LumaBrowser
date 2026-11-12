const DataMigration = require('../world/DataMigration');
const StoryLedger = require('../world/StoryLedger');
const SpeakerNames = require('../prompts/SpeakerNames');
const HistoryTrimmer = require('../prompts/HistoryTrimmer');
const ProseCleanup = require('../prompts/ProseCleanup');
const ReplyLength = require('../prompts/ReplyLength');
const RoleplayEnv = require('../images/RoleplayEnv');
const RpDebug = require('../images/RpDebug');
const BeatKind = require('../images/BeatKind');
const ImageCancellation = require('../images/ImageCancellation');
const HostGlobals = require('../HostGlobals');
const ArtAuditor = require('../audit/ArtAuditor');
const StageCall = require('../stage/StageCall');
const StageReconciler = require('../stage/StageReconciler');
const WorldDelta = require('../stage/WorldDelta');
const CastResolver = require('../world/CastResolver');
const TurnData = require('./TurnData');
const TurnChannel = require('./TurnChannel');
const AssetOutcomes = require('./AssetOutcomes');
const AssetSweepPlanner = require('./AssetSweepPlanner');
const RenderSignature = require('./RenderSignature');
const FastReaction = require('./FastReaction');
const ImagePhase = require('./ImagePhase');
const ProfileCall = require('./ProfileCall');
const PressureCall = require('./PressureCall');
const ConsolidateCall = require('./ConsolidateCall');
const ProsePolishCall = require('./ProsePolishCall');
const ReactionScope = require('./ReactionScope');
const ReactionRegistry = require('./ReactionRegistry');
const ScopedChat = require('./ScopedChat');
const ConversationPath = require('../world/ConversationPath');
const Timeline = require('../timeline');
const TurnJournal = require('../journal/TurnJournal');

class RoleplayPostProcessor {
  constructor(chat, logger = null, { paths = new ConversationPath(), reactions = new ReactionRegistry(), journal = TurnJournal.shared } = {}) {
    this._journal = journal;
    this._rawChat = chat;
    chat = ScopedChat.wrap(chat);
    this._chat = chat;
    this._logger = logger;
    this._paths = paths;
    this._reactions = reactions;
    this._auditor = new ArtAuditor(chat);
    this._stage = new StageCall(chat, logger);
    this._profiles = new ProfileCall(chat, logger);
    this._pressure = new PressureCall(chat, logger);
    this._consolidate = new ConsolidateCall(chat, logger);
    this._polish = new ProsePolishCall(chat, logger);
    this._images = new ImagePhase(chat);
  }

  async process(args) {
    const a = args || {};
    const scope = this._reactions.start(a.conversationId || null, a.assistantMessageId || null, () => this._abortImages());
    try {
      await ReactionScope.run(scope, () => this._process(a, scope));
    } finally {
      scope.markReconciled();
      this._reactions.end(scope);
    }
  }

  async _process({ content, conversationId = null, assistantMessageId, meta, emit, setMeta, replaceContent = null, aborted = false }, scope) {
    const paths = this._paths && this._paths.tracks(conversationId, assistantMessageId) ? this._paths : null;
    const turn = new TurnChannel({ emit, setMeta, messageId: assistantMessageId, conversationId, scope, paths });
    try {
      const raw = content;
      if (!aborted) content = await RoleplayPostProcessor._tidy(content, replaceContent, ReplyLength.recall(conversationId));
      content = HistoryTrimmer.stripDebris(content);
      this._journal.reply({
        conversationId, messageId: assistantMessageId, content: raw, tidied: content, aborted,
        row: this._paths && typeof this._paths.message === 'function' ? this._paths.message(assistantMessageId) : null,
      });
      if (aborted || !String(content || '').trim()) {
        this._journal.end({ conversationId, messageId: assistantMessageId, status: 'skipped', detail: aborted ? 'the reply was stopped' : 'the reply was empty' });
        turn.progress.done();
        return;
      }
      turn.beginWorld();
      turn.progress.say('Reading the scene…');
      await this._reactions.waitForEarlier(scope);
      const data = RoleplayPostProcessor._workingData(meta, paths, conversationId, assistantMessageId);
      const worldEmpty = !data.characters.length && !data.scenes.length;
      const before = Timeline.snapshot(data);
      content = await this._polishProse(data, content, replaceContent, turn);
      const { delta, directorShot } = await this._reconcile(data, content, worldEmpty, turn);
      const changes = turn.commit(data, before);
      this._noteJournal(data, conversationId);
      await turn.save(data);
      this._journal.changes({ conversationId, messageId: assistantMessageId, data, tree: paths ? paths.tree(conversationId) : [], changes });
      turn.announceWorld(data, delta.announcement());
      scope.markReconciled();
      turn.beginImages();
      await this._draw(data, content, delta, directorShot, turn);
      this._journal.end({ conversationId, messageId: assistantMessageId, status: 'finished' });
    } catch (err) {
      this._journal.end({
        conversationId, messageId: assistantMessageId,
        status: ReactionScope.isStop(err) ? 'stopped' : 'failed', detail: (err && err.message) || '',
      });
      this._failed(err, turn);
    }
  }

  _noteJournal(data, conversationId) {
    if (!this._journal.active(conversationId)) { if (data.turnLog) delete data.turnLog; return; }
    const p = this._journal.paths(conversationId);
    data.turnLog = { md: p.md, jsonl: p.jsonl };
  }

  static _workingData(meta, paths, conversationId, messageId) {
    const data = TurnData.from(paths ? { data: paths.data(conversationId) } : meta);
    Timeline.ensure(data);
    if (paths) Timeline.materialize(data, paths.ancestors(conversationId, messageId));
    return data;
  }

  static async _tidy(content, replaceContent, cap = 0) {
    const clean = ReplyLength.trim(ProseCleanup.clean(content), cap);
    if (clean === content || !clean.trim() || typeof replaceContent !== 'function') return content;
    try { return (await replaceContent(clean)) ? clean : content; } catch (_) { return content; }
  }

  _failed(err, turn) {
    if (ReactionScope.isStop(err)) {
      turn.activity.stopped(err.message);
      turn.emit('mode:image-fail', { messageId: turn.messageId, canceled: true });
      turn.progress.done();
      return;
    }
    if (err && err.code === ImageCancellation.CODE) {
      turn.emit('mode:image-fail', { messageId: turn.messageId, canceled: true });
      turn.progress.done();
    } else {
      turn.activity.failed();
    }
    if (this._logger && this._logger.warn) this._logger.warn('roleplay postProcess failed', { error: err && err.message });
  }

  _abortImages() {
    try { if (this._rawChat && typeof this._rawChat.abortImage === 'function') this._rawChat.abortImage(); } catch (_) {}
  }

  async prepareTurn({ conversationId = null, meta = null, signal = null, contextWindow = null } = {}) {
    if (!conversationId || !this._paths || !this._paths.available()) return meta;
    const path = this._paths.activeMessages(conversationId);
    if (!path.length) return meta;
    const ids = Timeline.continuationIds(path);
    const stopped = this._reactions.supersedeOffPath(conversationId, ids, 'replaced');
    const waitFrom = Date.now();
    await this._reactions.settled(conversationId, ids, signal);
    const data = TurnData.from({ data: this._paths.data(conversationId) });
    Timeline.ensure(data);
    Timeline.materialize(data, ids);
    this._journal.prepare({
      conversationId, data, tree: this._paths.tree(conversationId), path, continues: ids, stopped,
      waitedMs: Date.now() - waitFrom, contextWindow,
    });
    return Object.assign({}, meta || {}, { data });
  }

  async _polishProse(data, content, replaceContent, turn) {
    if (!ProsePolishCall.wanted(data)) return content;
    turn.progress.say('Polishing the prose…');
    const out = await this._polish.run(data, content);
    if (!out.changed) return content;
    if (typeof replaceContent === 'function') {
      try { if (!(await replaceContent(out.content))) return content; } catch (_) { return content; }
    }
    return out.content;
  }

  async _reconcile(data, content, worldEmpty, turn) {
    const delta = new WorldDelta();
    if (DataMigration.migrate(data)) delta.changed = true;
    const turnNo = StoryLedger.beginTurn(data);
    delta.changed = true;
    RoleplayPostProcessor._addSpeakers(data, content, delta);
    await this._audit(data, turn);
    let directorShot = null;
    if (this._wantStage()) {
      const ex = await this._stage.run(data, content);
      if (ex) {
        directorShot = ex.shot || null;
        StageReconciler.apply(data, ex, delta, { turn: turnNo, messageId: turn.messageId });
      }
    }
    await this._remember(data, content, delta, turn, worldEmpty);
    return { delta, directorShot };
  }

  static _addSpeakers(data, content, delta) {
    let added = false;
    const known = (n) => !!CastResolver.byName(data, n);
    for (const n of SpeakerNames.parse(content)) {
      if (known(n) || CastResolver.isPlayer(data, n)) continue;
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

  _wantStage() {
    return typeof this._chat.complete === 'function';
  }

  async _remember(data, content, delta, turn, worldEmpty) {
    const present = CastResolver.currentEntries(data).map((e) => e.char);
    const candidates = ProfileCall.candidates(data, present);
    if (candidates.length) {
      turn.progress.say('Getting to know ' + candidates.map((c) => c.name).join(' and ') + '…');
      if (await this._profiles.run(data, candidates, content)) delta.changed = true;
    }
    if (!worldEmpty && ConsolidateCall.due(data)) {
      turn.progress.say('Remembering the story so far…');
      if (await this._consolidate.run(data)) delta.changed = true;
    }
    if (PressureCall.due(data)) {
      turn.progress.say('Weighing what comes next…');
      if (await this._pressure.run(data, content)) delta.changed = true;
    }
  }

  async _draw(data, content, delta, directorShot, turn) {
    const sweep = AssetSweepPlanner.plan(data, { newCharIds: delta.newCharIds, newSceneId: delta.newSceneId });
    const pendingOutfits = AssetSweepPlanner.drawsFigures(data)
      ? RoleplayPostProcessor._withBackfills(delta.pendingOutfits, sweep.outfitBackfills) : [];
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

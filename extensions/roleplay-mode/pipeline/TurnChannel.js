const ReactionProgress = require('../images/ReactionProgress');
const TurnActivity = require('./TurnActivity');
const ReactionScope = require('./ReactionScope');
const Timeline = require('../timeline');

class TurnChannel {
  constructor({ emit = null, setMeta = null, messageId = null, conversationId = null, scope = null, paths = null } = {}) {
    this._emit = emit;
    this._setMeta = setMeta;
    this.messageId = messageId;
    this.conversationId = conversationId;
    this.scope = scope;
    this.paths = paths;
    this.phase = null;
    this.activity = new TurnActivity(emit, messageId);
    this.progress = new ReactionProgress(emit, messageId, {
      phase: () => this.phase,
      onSay: (label) => { if (this.phase === 'world') this.activity.step(label); },
    });
    this._committed = false;
    this._saved = null;
  }

  emit(type, payload) {
    if (typeof this._emit === 'function') this._emit(type, payload);
  }

  beginWorld() {
    this.phase = 'world';
    if (this.scope) this.scope.phase = 'world';
    this.activity.begin();
  }

  beginImages() {
    this.phase = 'images';
    if (this.scope) this.scope.phase = 'images';
  }

  commit(data, before) {
    this.guard();
    const changes = Timeline.changes(before, Timeline.snapshot(data));
    const activity = this.activity.done(changes);
    if (this.messageId) Timeline.commit(data, this.messageId, { activity });
    this._committed = true;
    return changes;
  }

  async save(data) {
    this.guard();
    if (this._committed && this.messageId) Timeline.commit(data, this.messageId);
    let out = data;
    if (this.paths) {
      out = Timeline.mergeForSave(this.paths.data(this.conversationId), data, {
        ownId: this._committed ? this.messageId : null,
        activeIds: this.paths.activeMessages(this.conversationId).map((m) => m.id),
        liveIds: this.paths.liveIds(this.conversationId),
      });
    }
    if (typeof this._setMeta === 'function') await this._setMeta({ data: out });
    this._saved = out;
  }

  guard() {
    if (this.scope) this.scope.throwIfStopped();
    if (!this.paths || this.paths.exists(this.messageId)) return;
    if (this.scope) { this.scope.stop('deleted'); this.scope.throwIfStopped(); }
    const err = new Error(ReactionScope.REASONS.deleted);
    err.code = ReactionScope.CODE;
    throw err;
  }

  async trySave(data) {
    try { await this.save(data); } catch (_) {}
  }

  announceWorld(data, extra = {}) {
    const head = this._saved || data;
    const point = Timeline.entry(data, this.messageId);
    this.emit('mode:world', {
      messageId: this.messageId,
      characters: head.characters, scenes: head.scenes, activeSceneId: head.activeSceneId,
      currentState: head.currentState,
      story: head.story,
      headId: head.headId === undefined ? null : head.headId,
      timelineEntry: point ? { id: this.messageId, entry: point } : null,
      newCharIds: extra.newCharIds || [], newSceneId: extra.newSceneId || null, sceneChanged: !!extra.sceneChanged,
    });
  }
}

module.exports = TurnChannel;

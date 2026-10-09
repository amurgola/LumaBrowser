const ReactionProgress = require('../images/ReactionProgress');

class TurnChannel {
  constructor({ emit = null, setMeta = null, messageId = null } = {}) {
    this._emit = emit;
    this._setMeta = setMeta;
    this.messageId = messageId;
    this.progress = new ReactionProgress(emit, messageId);
  }

  emit(type, payload) {
    if (typeof this._emit === 'function') this._emit(type, payload);
  }

  async save(data) {
    if (typeof this._setMeta === 'function') await this._setMeta({ data });
  }

  async trySave(data) {
    try { await this.save(data); } catch (_) {}
  }

  announceWorld(data, extra = {}) {
    this.emit('mode:world', {
      messageId: this.messageId,
      characters: data.characters, scenes: data.scenes, activeSceneId: data.activeSceneId,
      currentState: data.currentState,
      newCharIds: extra.newCharIds || [], newSceneId: extra.newSceneId || null, sceneChanged: !!extra.sceneChanged,
    });
  }
}

module.exports = TurnChannel;

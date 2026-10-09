const ChatDataWipe = require('../chat/ChatDataWipe');
const LlmTrace = require('../chat/LlmTrace');
const ToolResultSpill = require('../chat/ToolResultSpill');

class ChatDataReset {
  constructor({ deps, spill = ToolResultSpill, trace = LlmTrace }) {
    this._deps = deps;
    this._spill = spill;
    this._trace = trace;
  }

  wipe() {
    const result = new ChatDataWipe({
      settingsDb: this._deps.get('db'),
      dashboardService: this._deps.get('dashboardService'),
      artifactStore: this._deps.artifactStore(),
    }).execute();
    this._deps.emit('emitSchedTasksEvent', 'tasks-changed', {});
    this._wipeAppOwnedTrees();
    return { ...result };
  }

  _wipeAppOwnedTrees() {
    try {
      this._spill.wipeAll();
      this._trace.wipeAll();
    } catch (_) {}
  }
}

module.exports = ChatDataReset;

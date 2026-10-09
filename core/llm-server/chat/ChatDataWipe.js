const fs = require('fs');
const path = require('path');
const StoreHandle = require('../../database/StoreHandle');

class ChatDataWipe {
  static WIPED_TABLES = [
    'llm_scheduled_task_runs',
    'llm_scheduled_tasks',
    'llm_artifact_task_runs',
    'llm_artifact_tasks',
    'llm_artifact_data',
    'llm_artifacts',
    'llm_messages',
    'llm_conversation_meta',
    'llm_conversations',
  ];

  constructor({ settingsDb, dashboardService, artifactStore } = {}) {
    this._db = StoreHandle.requireOpen(settingsDb, 'wipeChatData');
    this._dashboard = dashboardService || null;
    this._artifactsDir = artifactStore && typeof artifactStore.dir === 'string' ? artifactStore.dir : null;
  }

  execute() {
    const deleted = this._emptyTables();
    this._resetDashboard();
    const files = this._sweepArtifactFiles();
    this._reclaimSpace();
    return { deleted, files };
  }

  _emptyTables() {
    const deleted = {};
    this._db.transaction(() => {
      for (const table of ChatDataWipe.WIPED_TABLES) deleted[table] = this._emptyTable(table);
    })();
    return deleted;
  }

  _emptyTable(table) {
    try {
      return this._db.prepare(`DELETE FROM ${table}`).run().changes;
    } catch (err) {
      if (/no such table/i.test(String(err && err.message))) return 0;
      throw err;
    }
  }

  _resetDashboard() {
    const dashboard = this._dashboard;
    if (!dashboard) return;
    ChatDataWipe._attempt(() => { if (typeof dashboard.setLayout === 'function') dashboard.setLayout([]); });
    ChatDataWipe._attempt(() => {
      if (typeof dashboard.getHiddenWidgets !== 'function' || typeof dashboard.setWidgetHidden !== 'function') return;
      for (const id of dashboard.getHiddenWidgets()) dashboard.setWidgetHidden(id, false);
    });
  }

  _sweepArtifactFiles() {
    if (!this._artifactsDir) return 0;
    let removed = 0;
    for (const name of ChatDataWipe._listOrEmpty(this._artifactsDir)) {
      if (!/\.html$/i.test(name)) continue;
      try {
        fs.unlinkSync(path.join(this._artifactsDir, name));
        removed++;
      } catch (_) {}
    }
    return removed;
  }

  _reclaimSpace() {
    ChatDataWipe._attempt(() => this._db.exec('VACUUM'));
  }

  static _listOrEmpty(dir) {
    try {
      return fs.readdirSync(dir);
    } catch (_) {
      return [];
    }
  }

  static _attempt(step) {
    try { step(); } catch (_) {}
  }
}

module.exports = ChatDataWipe;

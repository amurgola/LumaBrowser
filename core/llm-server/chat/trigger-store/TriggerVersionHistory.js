const crypto = require('crypto');
const TriggerLifecycle = require('./TriggerLifecycle');
const TriggerRowMapper = require('./TriggerRowMapper');

class TriggerVersionHistory {
  static KEEP = 10;
  static ORIGINS = ['create', 'edit', 'chat', 'rollback'];
  static MAX_NOTE_CHARS = 200;

  constructor(repository) {
    this._versions = repository;
  }

  static originOf(origin) {
    return TriggerVersionHistory.ORIGINS.includes(origin) ? origin : 'edit';
  }

  record(trigger, origin = 'edit', note = null, prevArmed = false) {
    const latest = this._versions.latest(trigger.id);
    const actionJson = JSON.stringify(trigger.action);
    if (latest && latest.action === actionJson) return TriggerRowMapper.version(latest);
    if (latest) this._versions.setWasArmed(latest.id, prevArmed ? 1 : 0);
    const row = TriggerVersionHistory._newRow(trigger, actionJson, latest ? latest.n + 1 : 1, origin, note);
    this._versions.insert(row);
    this._versions.prune(trigger.id, TriggerVersionHistory.KEEP);
    return TriggerRowMapper.version(this._versions.get(trigger.id, row.n));
  }

  list(triggerId) {
    const rows = this._versions.list(triggerId).map(TriggerRowMapper.version);
    if (rows.length) rows[0].current = true;
    return rows;
  }

  info(triggerId) {
    const rows = this.list(triggerId);
    if (!rows.length) return { current: 0, count: 0, previousTested: null };
    const previous = rows.slice(1).find((v) => v.tested);
    return { current: rows[0].n, count: rows.length, previousTested: previous ? previous.n : null };
  }

  find(triggerId, n) {
    return this._versions.get(triggerId, parseInt(n, 10));
  }

  markTested(triggerId, configHash, testAt, testRunId) {
    this._versions.markTested(triggerId, configHash, testAt, testRunId);
  }

  deleteForTrigger(triggerId) {
    this._versions.deleteForTrigger(triggerId);
  }

  static _newRow(trigger, actionJson, n, origin, note) {
    const hash = TriggerLifecycle.configHash(trigger);
    const lastTest = trigger.lastTest;
    const vouched = !!(lastTest && lastTest.ok && lastTest.configHash === hash);
    return {
      id: 'tv_' + crypto.randomBytes(8).toString('hex'),
      trigger_id: trigger.id,
      n,
      at: new Date().toISOString(),
      origin,
      action: actionJson,
      config_hash: hash,
      tested: vouched ? 1 : 0,
      test_at: vouched ? (lastTest.at || null) : null,
      test_run_id: vouched ? (lastTest.runId || null) : null,
      was_armed: 0,
      note: note ? String(note).slice(0, TriggerVersionHistory.MAX_NOTE_CHARS) : null,
    };
  }
}

module.exports = TriggerVersionHistory;

const QuietHours = require('../triggers/QuietHours');

class TriggerGatingParams {
  static QUIET_HOURS_ERROR = 'quiet_hours needs start and end as "HH:MM" (different from each other)';

  static toSource(params) {
    return {
      ...TriggerGatingParams._gates(params),
      ...TriggerGatingParams._failurePolicy(params),
      ...TriggerGatingParams._extras(params),
    };
  }

  static quietHoursError(source) {
    return source.quietHours && !QuietHours.normalize(source.quietHours) ? TriggerGatingParams.QUIET_HOURS_ERROR : null;
  }

  static _gates(p) {
    const src = {};
    if (p.filter !== undefined) src.filter = p.filter && typeof p.filter === 'object' && Object.keys(p.filter).length ? p.filter : null;
    if (p.cooldown_seconds !== undefined) src.cooldownMs = p.cooldown_seconds ? TriggerGatingParams._ms(p.cooldown_seconds) : null;
    if (p.batch_seconds !== undefined) src.batch = p.batch_seconds ? { windowMs: TriggerGatingParams._ms(p.batch_seconds), max: p.batch_max } : null;
    else if (p.batch_max !== undefined) src.batch = { keepWindow: true, max: p.batch_max };
    if (p.quiet_hours !== undefined) src.quietHours = p.quiet_hours || null;
    return src;
  }

  static _failurePolicy(p) {
    const src = {};
    if (p.auto_pause_after !== undefined) src.autoPauseAfter = p.auto_pause_after === null ? null : TriggerGatingParams._count(p.auto_pause_after);
    if (p.notify_failures !== undefined) src.notifyFailures = p.notify_failures === false ? false : null;
    if (p.retry_max !== undefined) src.retryMax = p.retry_max === null ? null : TriggerGatingParams._count(p.retry_max);
    if (p.retry_backoff_seconds !== undefined) src.retryBackoffMs = p.retry_backoff_seconds ? TriggerGatingParams._ms(p.retry_backoff_seconds) : null;
    return src;
  }

  static _extras(p) {
    const src = {};
    if (p.bot_guard !== undefined) src.botGuard = p.bot_guard === false ? false : null;
    if (p.memory !== undefined) src.memory = p.memory ? { runs: p.memory_runs, keepRuns: p.memory_runs === undefined } : null;
    else if (p.memory_runs !== undefined) src.memory = { runs: p.memory_runs, runsOnly: true };
    if (p.approval !== undefined) src.approval = p.approval === 'ask' ? 'ask' : null;
    if (p.approved_tools !== undefined) src.approvedTools = Array.isArray(p.approved_tools) && p.approved_tools.length ? p.approved_tools : null;
    return src;
  }

  static _ms(seconds) {
    return Math.round(Number(seconds) * 1000);
  }

  static _count(value) {
    return Math.max(0, Math.round(Number(value) || 0));
  }
}

module.exports = TriggerGatingParams;

const TriggerGating = require('../triggers/TriggerGating');
const QuietHours = require('../triggers/QuietHours');
const WebhookPresets = require('../triggers/WebhookPresets');
const FileWatch = require('../triggers/file/FileWatch');
const TriggerFailurePolicy = require('./TriggerFailurePolicy');
const TriggerMemoryPolicy = require('./TriggerMemoryPolicy');
const TriggerApprovalPolicy = require('./TriggerApprovalPolicy');

class TriggerSourceConfig {
  static KINDS = ['webhook', 'file', 'page', 'notification'];
  static RESPOND = ['ack', 'result'];
  static CLEARABLE_KEYS = ['filter', 'cooldownMs', 'batch', 'autoPauseAfter', 'notifyFailures', 'retryMax',
    'retryBackoffMs', 'approval', 'approvedTools', 'quietHours', 'botGuard', 'memory'];

  static normalize(kind, source = {}) {
    const s = source && typeof source === 'object' ? source : {};
    const shared = TriggerSourceConfig._shared(s);
    if (kind === 'webhook') return { ...TriggerSourceConfig._webhook(s), ...shared };
    if (kind === 'notification') return { ...TriggerSourceConfig._notification(s), ...shared };
    if (kind === 'page') return { ...TriggerSourceConfig._page(s), ...shared };
    if (kind === 'file') return { ...TriggerSourceConfig._file(s), ...shared };
    return { ...s };
  }

  static merge(current, patch) {
    const merged = { ...current, ...patch };
    for (const key of TriggerSourceConfig.CLEARABLE_KEYS) if (patch[key] === null) delete merged[key];
    return merged;
  }

  static _shared(s) {
    const out = TriggerGating.normalize(s);
    TriggerFailurePolicy.normalizeInto(s, out);
    const quiet = QuietHours.normalize(s.quietHours);
    if (quiet) out.quietHours = quiet;
    TriggerMemoryPolicy.normalizeInto(s, out);
    TriggerApprovalPolicy.normalizeInto(s, out);
    return out;
  }

  static _webhook(s) {
    const out = {
      respond: TriggerSourceConfig.RESPOND.includes(s.respond) ? s.respond : 'ack',
      preset: WebhookPresets.normalizePreset(s.preset),
    };
    TriggerSourceConfig._copyTrimmed(s, out, 'dedupeHeader');
    TriggerSourceConfig._copyTrimmed(s, out, 'authHeader');
    if (s.botGuard === false) out.botGuard = false;
    return out;
  }

  static _notification(s) {
    const host = TriggerSourceConfig._bareHost(s.host);
    const tabPartition = String(s.tabPartition || '').trim();
    if (!host && !tabPartition) throw new Error('a notification trigger needs a site (host) or a persisted tab (tabPartition)');
    const out = {};
    if (host) out.host = host;
    if (tabPartition) {
      out.tabPartition = tabPartition;
      if (s.tabTitle) out.tabTitle = String(s.tabTitle).slice(0, 200);
      if (s.tabUrl) out.tabUrl = String(s.tabUrl).slice(0, 500);
    }
    return out;
  }

  static _page(s) {
    const monitorId = s.monitorId != null ? String(s.monitorId).trim() : '';
    if (!monitorId) throw new Error('a page trigger needs a monitorId (a Page Watcher monitor)');
    const out = { monitorId };
    if (s.url) out.url = String(s.url);
    if (s.name) out.name = String(s.name);
    return out;
  }

  static _file(s) {
    const dir = String(s.dir || '').trim();
    if (!dir) throw new Error('a file trigger needs a folder (dir)');
    return {
      dir,
      glob: String(s.glob || '*').trim() || '*',
      events: TriggerSourceConfig._fileEvents(s.events),
      settleMs: TriggerSourceConfig._settleMs(s.settleMs),
      recursive: !!s.recursive,
      allowWrite: !!s.allowWrite,
      catchUp: s.catchUp !== false,
    };
  }

  static _fileEvents(events) {
    const known = Array.isArray(events) ? events.filter((e) => FileWatch.FILE_EVENTS.includes(e)) : [];
    return known.length ? [...new Set(known)] : FileWatch.DEFAULT_EVENTS.slice();
  }

  static _settleMs(value) {
    const settle = parseInt(value, 10);
    if (!Number.isFinite(settle)) return FileWatch.DEFAULT_SETTLE_MS;
    return Math.min(FileWatch.MAX_SETTLE_MS, Math.max(FileWatch.MIN_SETTLE_MS, settle));
  }

  static _bareHost(host) {
    return String(host || '').trim().toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/\/.*$/, '')
      .replace(/^www\./, '');
  }

  static _copyTrimmed(s, out, key) {
    const value = s[key] ? String(s[key]).trim() : '';
    if (value) out[key] = value;
  }
}

module.exports = TriggerSourceConfig;

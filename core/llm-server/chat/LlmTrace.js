const LlmTraceWriter = require('./trace/LlmTraceWriter');
const LlmTraceRecord = require('./trace/LlmTraceRecord');
const LlmCallRecorder = require('./trace/LlmCallRecorder');

class LlmTrace {
  static SETTING_KEY = 'core.llm.traceCalls';
  static FORCE_FLAG = '--trace-llm';
  static FORCE_ENV = 'LUMA_TRACE_LLM';
  static POINTER_FILE = LlmTraceWriter.POINTER_FILE;
  static FORCE_VALUES = /^(1|true|on|yes)$/i;
  static _writer = new LlmTraceWriter();

  static forced(argv = process.argv, env = process.env) {
    try {
      if (Array.isArray(argv) && argv.includes(LlmTrace.FORCE_FLAG)) return true;
      return LlmTrace.FORCE_VALUES.test(String((env && env[LlmTrace.FORCE_ENV]) || ''));
    } catch (_) {
      return false;
    }
  }

  static enabled(db) {
    return LlmTrace.forced() || LlmTrace._settingOn(db);
  }

  static status(db) {
    const setting = LlmTrace._settingOn(db);
    const isForced = LlmTrace.forced();
    return { enabled: isForced || setting, setting, forced: isForced, flag: LlmTrace.FORCE_FLAG, env: LlmTrace.FORCE_ENV };
  }

  static instrument({ hooks, tag, model, requestBody }) {
    const recorder = new LlmCallRecorder({ tag, model, requestBody, onRecord: (id, rec) => LlmTrace.record(id, rec) });
    return recorder.wrap(hooks);
  }

  static record(conversationId, record) {
    LlmTrace._writer.append(conversationId, record);
  }

  static deleteFor(conversationId) {
    LlmTrace._writer.deleteFor(conversationId);
  }

  static wipeAll() {
    LlmTrace._writer.wipeAll();
  }

  static sanitizeBody(body) {
    return LlmTraceRecord.sanitizeBody(body);
  }

  static traceDir() {
    return LlmTrace._writer.directory();
  }

  static setDirectory(dir) {
    LlmTrace._writer.setDirectory(dir);
  }

  static _settingOn(db) {
    try {
      return !!(db && typeof db.get === 'function' && db.get(LlmTrace.SETTING_KEY, false) === true);
    } catch (_) {
      return false;
    }
  }
}

module.exports = LlmTrace;

const vm = require('vm');

class CodeSandbox {
  static CASE_TIMEOUT_MS = 5000;
  static WRAPPER_PREAMBLE = '"use strict";\n';
  static WRAPPER_EPILOGUE = "\n;if (typeof run !== 'function') "
    + "throw new Error('Your code must declare an async function named run(args, ctx).');\n"
    + '__invoke = run(args, ctx);';

  static async runOnce({ code, args, ctx, timeoutMs = CodeSandbox.CASE_TIMEOUT_MS }) {
    const sandbox = CodeSandbox._buildSandbox(args, ctx);
    const context = CodeSandbox._createContext(sandbox);
    if (context.error) return { ok: false, error: context.error };
    const compileError = CodeSandbox._runSynchronousPhase(code, context.value, timeoutMs);
    if (compileError) return { ok: false, error: compileError };
    return CodeSandbox._awaitAsyncPhase(sandbox, timeoutMs);
  }

  static _buildSandbox(args, ctx) {
    const sandbox = {
      args: args || {},
      ctx: ctx || {},
      __invoke: undefined,
      console: { log() {}, info() {}, warn() {}, error() {}, debug() {} },
      Math, JSON, Date, Object, Array, String, Number, Boolean, Map, Set,
      RegExp, Error, TypeError, RangeError, Promise, isNaN, isFinite,
      parseInt, parseFloat, Infinity, NaN, undefined,
    };
    if (ctx && ctx.__inject) Object.assign(sandbox, ctx.__inject.__ambient || {});
    return sandbox;
  }

  static _createContext(sandbox) {
    try {
      return { value: vm.createContext(sandbox) };
    } catch (e) {
      return { error: `sandbox setup failed: ${(e && e.message) || e}` };
    }
  }

  static _runSynchronousPhase(code, context, timeoutMs) {
    try {
      const script = new vm.Script(CodeSandbox.WRAPPER_PREAMBLE + String(code || '') + CodeSandbox.WRAPPER_EPILOGUE);
      script.runInContext(context, { timeout: timeoutMs });
      return null;
    } catch (e) {
      const message = (e && e.message) || String(e);
      return /timed out/i.test(message) ? CodeSandbox._timeoutMessage(timeoutMs) : message;
    }
  }

  static async _awaitAsyncPhase(sandbox, timeoutMs) {
    let timer = null;
    try {
      const guard = new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(CodeSandbox._timeoutMessage(timeoutMs))), timeoutMs);
        if (timer.unref) timer.unref();
      });
      const result = await Promise.race([Promise.resolve(sandbox.__invoke), guard]);
      return CodeSandbox._serializable(result);
    } catch (e) {
      return { ok: false, error: (e && e.message) || String(e) };
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  static _serializable(result) {
    try {
      return { ok: true, result: JSON.parse(JSON.stringify(result === undefined ? null : result)) };
    } catch (_) {
      return { ok: false, error: 'returned a value that is not JSON-serializable' };
    }
  }

  static _timeoutMessage(timeoutMs) {
    return `execution timed out after ${timeoutMs}ms`;
  }
}

module.exports = CodeSandbox;

export default class SandboxRunner {
  static PREAMBLE = '"use strict";\n';
  static EPILOGUE = "\n;if (typeof run !== 'function') "
    + "throw new Error('Your tool code must declare an async function named run(args, ctx).');\n"
    + 'return run(args, ctx);';

  static NOT_SERIALIZABLE = 'Tool returned a value that cannot be serialized (functions, circular refs, etc.). Return plain JSON-compatible data.';

  constructor(forge, doc = document) {
    this._forge = forge;
    this._doc = doc;
  }

  start() {
    this._forge.onExec((msg) => {
      this.run(msg).catch((e) => this._forge.result({
        callId: msg && msg.callId,
        ok: false,
        error: 'Runner failure: ' + ((e && e.message) || e),
      }));
    });
  }

  async run(msg) {
    this._forge.result({ callId: msg.callId, ...(await this._execute(msg)) });
  }

  async _execute(msg) {
    let F;
    try {
      F = this._freshFunctionCtor();
    } catch (e) {
      return { ok: false, error: 'Sandbox realm error: ' + ((e && e.message) || e) };
    }
    let fn;
    try {
      fn = new F('args', 'ctx', SandboxRunner.PREAMBLE + String(msg.code || '') + SandboxRunner.EPILOGUE);
    } catch (e) {
      return { ok: false, error: 'Tool code failed to compile: ' + ((e && e.message) || e) };
    }
    try {
      return SandboxRunner._serializable(await fn(msg.args || {}, this._makeCtx(msg.callId, msg.config)));
    } catch (e) {
      return { ok: false, error: 'Tool threw: ' + ((e && e.message) || e) };
    }
  }

  _freshFunctionCtor() {
    const frame = this._doc.createElement('iframe');
    frame.setAttribute('sandbox', 'allow-same-origin allow-scripts');
    frame.style.display = 'none';
    this._doc.body.appendChild(frame);
    const ctor = frame.contentWindow.Function;
    this._doc.body.removeChild(frame);
    return ctor;
  }

  _makeCtx(callId, config) {
    const net = (op, params) => this._forge.net({ callId, op, params });
    return {
      config: config || {},
      fetch: (url, options) => net('fetch', Object.assign({ url }, options || {})),
      luma: {
        fetchPage: (params) => net('fetchPage', params || {}),
        openTab: (params) => net('openTab', params || {}),
      },
    };
  }

  static _serializable(result) {
    try {
      return { ok: true, result: JSON.parse(JSON.stringify(result === undefined ? null : result)) };
    } catch (_) {
      return { ok: false, error: SandboxRunner.NOT_SERIALIZABLE };
    }
  }
}

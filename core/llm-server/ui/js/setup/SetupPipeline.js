import SetupHooks from './SetupHooks.js';

export default class SetupPipeline {
  static FAILURE_MESSAGE = 'Setup failed';

  static CANCELED = Object.freeze({ ok: false, canceled: true });

  constructor(opts) {
    this._opts = opts || {};
    this._hooks = SetupHooks.from(this._opts);
  }

  async run() {
    const invalid = this._validate();
    if (invalid) return invalid;
    try {
      return await this._execute();
    } catch (err) {
      return { ok: false, message: (err && err.message) || this.constructor.FAILURE_MESSAGE };
    }
  }

  _validate() {
    return null;
  }

  _execute() {
    throw new Error(`${this.constructor.name} must implement _execute()`);
  }

  _canceled() {
    return { ...SetupPipeline.CANCELED };
  }

  static _failure(reply, fallback, strict) {
    const failed = strict ? (!reply || !reply.success) : (!reply || reply.success === false);
    if (!failed) return null;
    return { ok: false, message: fallback + (reply && reply.error ? ': ' + reply.error : '') };
  }
}

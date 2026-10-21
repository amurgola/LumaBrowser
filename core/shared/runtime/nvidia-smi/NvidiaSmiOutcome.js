class NvidiaSmiOutcome {
  static NONE = 'none';
  static OK = 'ok';
  static MISSING = 'missing';
  static TIMEOUT = 'timeout';
  static EXIT = 'exit';
  static PARSE = 'parse';
  static KINDS = Object.freeze([
    NvidiaSmiOutcome.NONE, NvidiaSmiOutcome.OK, NvidiaSmiOutcome.MISSING,
    NvidiaSmiOutcome.TIMEOUT, NvidiaSmiOutcome.EXIT, NvidiaSmiOutcome.PARSE,
  ]);

  static of(kind, reason = null, at = null) {
    return { kind, reason: reason || null, at };
  }

  static none() {
    return NvidiaSmiOutcome.of(NvidiaSmiOutcome.NONE);
  }

  static ok(at) {
    return NvidiaSmiOutcome.of(NvidiaSmiOutcome.OK, null, at);
  }

  static fromError(err, at = null) {
    if (!err) return NvidiaSmiOutcome.ok(at);
    if (NvidiaSmiOutcome.isMissingError(err)) return NvidiaSmiOutcome.of(NvidiaSmiOutcome.MISSING, 'nvidia-smi not found', at);
    if (err.killed || err.signal || err.code === 'ETIMEDOUT') {
      return NvidiaSmiOutcome.of(NvidiaSmiOutcome.TIMEOUT, `nvidia-smi timed out (${err.signal || err.code || 'killed'})`, at);
    }
    if (typeof err.code === 'number') return NvidiaSmiOutcome.fromExit(err.code, null, at, err.stderr);
    return NvidiaSmiOutcome.of(NvidiaSmiOutcome.EXIT, err.message || String(err), at);
  }

  static fromExit(code, signal, at = null, stderr = '') {
    const detail = NvidiaSmiOutcome._lastLine(stderr);
    const head = signal ? `nvidia-smi killed by ${signal}` : `nvidia-smi exited with code ${code}`;
    return NvidiaSmiOutcome.of(NvidiaSmiOutcome.EXIT, detail ? `${head}: ${detail}` : head, at);
  }

  static parse(at = null, reason = 'nvidia-smi output had no GPU rows') {
    return NvidiaSmiOutcome.of(NvidiaSmiOutcome.PARSE, reason, at);
  }

  static timeout(at = null, reason = 'nvidia-smi stopped producing output') {
    return NvidiaSmiOutcome.of(NvidiaSmiOutcome.TIMEOUT, reason, at);
  }

  static missing(at = null, reason = 'nvidia-smi not found') {
    return NvidiaSmiOutcome.of(NvidiaSmiOutcome.MISSING, reason, at);
  }

  static isMissingError(err) {
    return !!err && (err.code === 'ENOENT' || /ENOENT|not found/i.test(String(err.message || '')));
  }

  static isOk(outcome) {
    return !!outcome && outcome.kind === NvidiaSmiOutcome.OK;
  }

  static isDegraded(outcome) {
    return !!outcome && outcome.kind !== NvidiaSmiOutcome.OK && outcome.kind !== NvidiaSmiOutcome.NONE;
  }

  static _lastLine(text) {
    const lines = String(text || '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    return lines.length ? lines[lines.length - 1] : '';
  }
}

module.exports = NvidiaSmiOutcome;

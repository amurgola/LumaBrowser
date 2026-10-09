const FileObservation = require('../FileObservation');

class ReadGuard {
  static NOT_OBSERVED = 'FS_NOT_OBSERVED';
  static STALE_VERSION = 'FS_STALE_VERSION';

  constructor({ fsOps, enforce = true }) {
    this._fs = fsOps;
    this._enforce = enforce !== false;
    this._ledger = new FileObservation();
  }

  observe(absPath, knownText) {
    this._ledger.observe(absPath, this._stampFor(absPath, knownText));
  }

  forgetUnder(absDir) {
    this._ledger.forgetUnder(absDir);
  }

  refusal(absPath, relPath, verb) {
    if (!this._enforce || !this._stat(absPath)) return null;
    const current = this._stampFor(absPath);
    if (!current) return null;
    const seen = this._ledger.get(absPath);
    if (!seen) return ReadGuard._notObserved(relPath, verb);
    if (seen !== current) return ReadGuard._stale(relPath, verb);
    return null;
  }

  stat(absPath) {
    return this._stat(absPath);
  }

  _stampFor(absPath, knownText) {
    if (typeof knownText === 'string') return FileObservation.stampOfText(knownText);
    try {
      return FileObservation.stampOfText(this._fs.readFileSync(absPath, 'utf8'));
    } catch (_) {
      return FileObservation.stampOf(this._stat(absPath));
    }
  }

  _stat(absPath) {
    try {
      return this._fs.statSync(absPath);
    } catch (_) {
      return null;
    }
  }

  static _notObserved(relPath, verb) {
    return {
      code: ReadGuard.NOT_OBSERVED,
      error: `${verb} refused: ${relPath} already exists and has not been read in this session. `
        + `(${ReadGuard.NOT_OBSERVED}) Read the file first, then retry.`,
    };
  }

  static _stale(relPath, verb) {
    return {
      code: ReadGuard.STALE_VERSION,
      error: `${verb} refused: ${relPath} is not the version you read. `
        + `(${ReadGuard.STALE_VERSION}) The file changed since you read it. Read it again, then retry.`,
    };
  }
}

module.exports = ReadGuard;

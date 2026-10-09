const fs = require('fs');
const path = require('path');
const CoreRequire = require('../../CoreRequire');

const ContainerFs = CoreRequire.require('shell/ContainerFs');
const FileObservation = CoreRequire.require('shell/FileObservation');
const ContextBudget = CoreRequire.require('shared/llm/ContextBudget');

class WholeReadGuard {
  static DEFAULT_FLOOR_BYTES = 8 * 1024;

  constructor({ budgetChars, fsOps = ContainerFs.routed(fs) }) {
    this._budgetChars = budgetChars;
    this._fs = fsOps;
  }

  static budgetFor(ctxPerSlot, chunkMaxBytes) {
    const floor = Number(chunkMaxBytes) > 0 ? Number(chunkMaxBytes) : WholeReadGuard.DEFAULT_FLOOR_BYTES;
    const n = Number(ctxPerSlot);
    if (!Number.isFinite(n) || n <= 0) return floor;
    return Math.max(floor, ContextBudget.resolveBudget({ ctxPerSlot: n }).toolHistoryChars);
  }

  isHeld(s, relPath) {
    const prior = s.readWhole && s.readWhole.get(relPath);
    if (!prior) return false;
    const stampNow = this.stamp(s.dir, relPath);
    const unchanged = !!stampNow && prior.stamp === stampNow;
    const fresh = (s.served - prior.at) <= this._budgetChars;
    return unchanged && fresh;
  }

  record(s, relPath, servedChars) {
    if (!s.readWhole) return;
    s.readWhole.set(relPath, { stamp: this.stamp(s.dir, relPath), at: s.served + servedChars });
  }

  forget(s, relPath) {
    if (s && s.readWhole) s.readWhole.delete(relPath);
  }

  stamp(dir, relPath) {
    const abs = path.join(dir, relPath);
    try { return FileObservation.stampOfText(this._fs.readFileSync(abs, 'utf8')); } catch (_) {}
    try { return FileObservation.stampOf(this._fs.statSync(abs)); } catch (_) { return null; }
  }
}

module.exports = WholeReadGuard;

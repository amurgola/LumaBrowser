const VramBand = require('./VramBand');

class WatchedCard {
  constructor(index, row) {
    this.index = index;
    this.name = row && row.name ? row.name : `GPU ${index}`;
    this.totalBytes = row ? row.totalBytes : null;
    this.freeBytes = null;
    this.reserveBytes = null;
    this.lastClaimTs = 0;
    this.reset();
  }

  reset() {
    this.band = 'normal';
    this.since = null;
    this._clearCandidate();
    this.dismissedBand = null;
    this.unloadedAt = null;
    this.ownLoad = false;
    this.ownLoadUntil = 0;
  }

  updateFromRow(row) {
    if (row && row.name) this.name = row.name;
    if (row && row.totalBytes) this.totalBytes = row.totalBytes;
  }

  trackOwnLoad({ stamp, loading, now, graceMs }) {
    if (stamp > this.lastClaimTs) {
      this.lastClaimTs = stamp;
      this.ownLoadUntil = now + graceMs;
    }
    if (loading) this.ownLoadUntil = now + graceMs;
    this.ownLoad = loading || now < this.ownLoadUntil;
    if (this.ownLoad) this._clearCandidate();
    return this.ownLoad;
  }

  sample(confirmSamples) {
    const next = VramBand.of(this.freeBytes, this.reserveBytes);
    if (next === this.band) {
      this._clearCandidate();
      return null;
    }
    if (this.candidate === next) this.candidateRuns += 1;
    else { this.candidate = next; this.candidateRuns = 1; }
    return this.candidateRuns >= confirmSamples ? next : null;
  }

  commit(next, now) {
    const prev = this.band;
    this.band = next;
    this.since = now;
    this._clearCandidate();
    if (this.dismissedBand !== null && this.dismissedBand !== next) this.dismissedBand = null;
    if (next === 'normal') this.unloadedAt = null;
    return prev;
  }

  dismiss() {
    if (this.band === 'normal') return false;
    this.dismissedBand = this.band;
    return true;
  }

  unloadDue(now, dwellMs) {
    if (this.band !== 'critical' || this.unloadedAt !== null) return false;
    return now - (this.since || now) >= dwellMs;
  }

  markUnloaded(now) {
    this.unloadedAt = now;
  }

  view() {
    return {
      card: this.index,
      name: this.name,
      totalBytes: this.totalBytes,
      freeBytes: this.freeBytes,
      reserveBytes: this.reserveBytes,
      band: this.band,
      since: this.since,
      dismissed: this.dismissedBand === this.band && this.band !== 'normal',
      ownLoad: this.ownLoad,
    };
  }

  _clearCandidate() {
    this.candidate = null;
    this.candidateRuns = 0;
  }
}

module.exports = WatchedCard;

import ByteFormatter from '../format/ByteFormatter.js';
import TransferText from '../format/TransferText.js';

export default class AutoSetupProgress {
  constructor(legs, raw) {
    this._legs = legs;
    this._raw = raw;
    this._totalBytes = legs.reduce((sum, leg) => sum + leg.bytes, 0);
    this._doneBytes = 0;
    this._current = null;
    this._currentIndex = -1;
    this._inDownload = false;
    this._legPeak = 0;
  }

  pipelineHooks() {
    return {
      isCanceled: this._raw.isCanceled,
      onPhase: (text) => this.phase(text),
      onBar: (fraction, subText, payload) => this.setBar(fraction, subText, payload),
      onSub: this._raw.sub,
    };
  }

  beginLeg(key) {
    this._currentIndex = this._legs.findIndex((leg) => leg.key === key);
    this._current = this._currentIndex >= 0 ? this._legs[this._currentIndex] : null;
    this._inDownload = false;
    this._legPeak = 0;
  }

  endLeg() {
    if (this._current) this._doneBytes += this._current.bytes;
    this._current = null;
    this._inDownload = false;
    this._legPeak = 0;
  }

  phase(text) {
    this._inDownload = /^Downloading/i.test(String(text || ''));
    if (this._inDownload && this._current && this._legs.length > 0) this._raw.phase(this._downloadPhase());
    else this._raw.phase(text);
  }

  setBar(fraction, subText, payload) {
    if (!this._current || !(this._totalBytes > 0)) return this._raw.setBar(fraction, subText);
    if (this._inDownload && fraction != null) this._legPeak = Math.max(this._legPeak, Math.min(1, fraction));
    const legDone = this._doneBytes + this._legPeak * this._current.bytes;
    return this._raw.setBar(Math.min(1, legDone / this._totalBytes), this._subTextWithOverallEta(subText, payload, legDone));
  }

  _downloadPhase() {
    const leg = this._current;
    return 'Downloading ' + (this._currentIndex + 1) + ' of ' + this._legs.length + ': ' + leg.label
      + (leg.bytes ? ' (' + ByteFormatter.gb(leg.bytes) + ')' : '');
  }

  _subTextWithOverallEta(subText, payload, legDone) {
    const rate = payload && Number(payload.bytesPerSec);
    if (!(this._inDownload && rate > 0 && this._legs.length > 1)) return subText;
    const eta = TransferText.eta(((this._totalBytes - legDone) / rate) * 1000);
    return [subText, eta ? 'overall ' + eta : ''].filter(Boolean).join(TransferText.SEPARATOR);
  }
}

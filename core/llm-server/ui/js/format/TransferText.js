import ByteFormatter from './ByteFormatter.js';

export default class TransferText {
  static SEPARATOR = ' · ';

  static MIB = 1024 * 1024;

  static rate(bytesPerSec) {
    const bps = Number(bytesPerSec) || 0;
    if (bps <= 0) return '';
    const mb = bps / TransferText.MIB;
    if (mb >= 100) return mb.toFixed(0) + ' MB/s';
    if (mb >= 1) return mb.toFixed(1) + ' MB/s';
    return Math.max(1, Math.round(bps / 1024)) + ' KB/s';
  }

  static eta(ms) {
    const seconds = Math.round((Number(ms) || 0) / 1000);
    if (!(seconds > 0)) return '';
    if (seconds < 45) return 'a few seconds left';
    const mins = Math.round(seconds / 60);
    if (mins <= 1) return 'about a minute left';
    if (mins < 60) return 'about ' + mins + ' min left';
    return TransferText._hoursLeft(mins);
  }

  static downloadSubText(payload) {
    const p = payload || {};
    const total = Number(p.total) || 0;
    const received = Number(p.received) || 0;
    return [
      ByteFormatter.gb(received) + (total ? ' / ' + ByteFormatter.gb(total) : ' downloaded'),
      TransferText.rate(p.bytesPerSec),
      TransferText.eta(p.etaMs),
    ].filter(Boolean).join(TransferText.SEPARATOR);
  }

  static _hoursLeft(mins) {
    const hrs = Math.floor(mins / 60);
    const rem = mins % 60;
    return 'about ' + hrs + 'h' + (rem ? ' ' + rem + 'm' : '') + ' left';
  }
}

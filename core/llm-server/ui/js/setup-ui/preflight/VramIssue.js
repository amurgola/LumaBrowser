import ByteFormatter from '../../format/ByteFormatter.js';

export default class VramIssue {
  static LIVE = 'vram';

  static from(card) {
    const name = card.name || `GPU ${card.card}`;
    const critical = card.band === 'critical';
    return {
      live: VramIssue.LIVE,
      card: card.card,
      severity: critical ? 'error' : 'warning',
      title: `${name} is low on free VRAM`,
      detail: `${name} is down to ${VramIssue._bytes(card.freeBytes)} free (reserve ${VramIssue._bytes(card.reserveBytes)}). ${VramIssue._tail(critical)}`,
      fix: { kind: 'dismiss-vram' },
    };
  }

  static _bytes(n) {
    return ByteFormatter.bytes(n, { zero: '0 B' });
  }

  static _tail(critical) {
    return critical
      ? 'Another app may be using it; generations can fail or slow.'
      : 'Another app may be using it; long generations may slow down.';
  }
}

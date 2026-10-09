const ByteLadder = require('../ByteLadder');

class VramPressureText {
  static describe(card) {
    const name = card.name || `GPU ${card.card}`;
    const head = `${name} is down to ${VramPressureText._bytes(card.freeBytes)} free (reserve ${VramPressureText._bytes(card.reserveBytes)}).`;
    const tail = card.band === 'critical'
      ? 'Another app may be using it; generations can fail or slow.'
      : 'Another app may be using it; long generations may slow down.';
    return `${head} ${tail}`;
  }

  static _bytes(n) {
    return ByteLadder.format(n, { zero: '0 B' });
  }
}

module.exports = VramPressureText;

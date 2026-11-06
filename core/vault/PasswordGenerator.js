const crypto = require('crypto');

class PasswordGenerator {
  static LENGTH = 20;
  static CLASSES = ['abcdefghijkmnopqrstuvwxyz', 'ABCDEFGHJKLMNPQRSTUVWXYZ', '23456789', '-_.!@#$%*'];

  static generate(length = PasswordGenerator.LENGTH, randomInt = crypto.randomInt) {
    const size = Math.max(PasswordGenerator.CLASSES.length, Number(length) || PasswordGenerator.LENGTH);
    const all = PasswordGenerator.CLASSES.join('');
    const chars = PasswordGenerator.CLASSES.map((set) => set[randomInt(set.length)]);
    while (chars.length < size) chars.push(all[randomInt(all.length)]);
    for (let i = chars.length - 1; i > 0; i--) {
      const j = randomInt(i + 1);
      [chars[i], chars[j]] = [chars[j], chars[i]];
    }
    return chars.join('');
  }
}

module.exports = PasswordGenerator;

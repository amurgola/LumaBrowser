const CharacterChronicle = require('./CharacterChronicle');

class CastRole {
  static ESTABLISHED_BEATS = 3;
  static ARTICLES = new Set(['the', 'a', 'an', 'some', 'another', 'other', 'one']);
  static ROLE_WORDS = new Set([
    'customer', 'patron', 'regular', 'client', 'guest', 'visitor', 'stranger', 'passerby', 'bystander', 'onlooker',
    'man', 'woman', 'boy', 'girl', 'child', 'kid', 'teen', 'teenager', 'lady', 'gentleman', 'guy', 'fellow', 'person',
    'figure', 'voice', 'someone', 'crowd', 'group', 'people', 'couple', 'pair', 'family', 'neighbour', 'neighbor',
    'guard', 'soldier', 'officer', 'cop', 'policeman', 'policewoman', 'sentry', 'watchman', 'knight', 'thug', 'bandit',
    'waiter', 'waitress', 'server', 'barista', 'bartender', 'barkeep', 'innkeeper', 'cook', 'chef', 'clerk', 'cashier',
    'shopkeeper', 'vendor', 'merchant', 'driver', 'cabbie', 'pilot', 'sailor', 'porter', 'maid', 'servant', 'butler',
    'nurse', 'medic', 'student', 'teacher', 'worker', 'farmer', 'villager', 'townsfolk', 'traveller', 'traveler',
    'beggar', 'drunk', 'priest', 'monk', 'messenger', 'courier', 'receptionist', 'secretary', 'assistant', 'owner',
    'old', 'young', 'elderly', 'tall', 'short', 'hooded', 'masked', 'cloaked', 'first', 'second', 'third', 'new',
    'unknown', 'unnamed', 'mysterious', 'strange', 'male', 'female', 'little', 'big', 'other',
  ]);

  static isLabel(name) {
    const words = String(name || '').toLowerCase().replace(/[^a-z0-9' ]+/g, ' ').split(/\s+/).filter(Boolean);
    if (!words.length) return true;
    if (/^#?\d+$/.test(words[words.length - 1])) return true;
    if (CastRole.ARTICLES.has(words[0])) return true;
    return words.every((w) => CastRole.ROLE_WORDS.has(w));
  }

  static STORY = 'story';

  static isWalkOn(char) {
    if (!char || !char.name) return false;
    if (char.origin !== CastRole.STORY) return false;
    if (!CastRole.isLabel(char.name)) return false;
    return CharacterChronicle.of(char).beats.length < CastRole.ESTABLISHED_BEATS;
  }
}

module.exports = CastRole;

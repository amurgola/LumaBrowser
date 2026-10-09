const CharacterLooks = require('../world/CharacterLooks');

class SubjectTag {
  static CAP = 6;

  static forCast(present) {
    if (!Array.isArray(present) || !present.length) return '';
    const counts = SubjectTag._count(present);
    const parts = [];
    if (counts.girl) parts.push(SubjectTag._word(counts.girl, 'girl', 'girls'));
    if (counts.boy) parts.push(SubjectTag._word(counts.boy, 'boy', 'boys'));
    if (counts.other) parts.push(SubjectTag._word(counts.other, 'other', 'others'));
    if (present.length === 1) parts.push('solo');
    return parts.join(', ');
  }

  static _count(present) {
    const counts = { girl: 0, boy: 0, other: 0 };
    for (const c of present) counts[CharacterLooks.booruGender(c)] += 1;
    return counts;
  }

  static _word(n, singular, plural) {
    if (n >= SubjectTag.CAP) return SubjectTag.CAP + '+' + plural;
    return n === 1 ? '1' + singular : n + plural;
  }
}

module.exports = SubjectTag;

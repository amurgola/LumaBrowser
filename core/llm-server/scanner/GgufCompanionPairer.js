const GgufFileName = require('../models/GgufFileName');

class GgufCompanionPairer {
  static DRAFT_MAX_RATIO = 0.2;

  static DRAFT_HINTED_MAX_RATIO = 0.5;

  static MIN_LINK_KEY_LENGTH = 4;

  static pair(companion, groups) {
    const candidates = GgufCompanionPairer._candidates(companion, groups);
    const families = GgufCompanionPairer.families(candidates);
    if (!families.length) return { status: 'none', groups: [], candidates, reason: 'no model in this folder can use it' };
    if (families.length === 1) {
      return { status: 'paired', groups: families[0], candidates, reason: 'only model family in this folder' };
    }
    const linked = families.filter((family) => family.some((g) => GgufCompanionPairer.namesLinked(companion.keys, g.keys)));
    if (linked.length === 1) return { status: 'paired', groups: linked[0], candidates, reason: 'linked by name' };
    const reason = linked.length === 0
      ? `none of ${families.length} model families in this folder matches its name`
      : `${linked.length} model families in this folder could claim it`;
    return { status: 'ambiguous', groups: [], candidates, reason };
  }

  static families(groups) {
    const families = [];
    for (const group of groups) {
      const home = families.find((family) => family.some((member) => GgufCompanionPairer.namesLinked(member.keys, group.keys)));
      if (home) home.push(group);
      else families.push([group]);
    }
    return families;
  }

  static namesLinked(keysA, keysB) {
    for (const a of keysA || []) {
      for (const b of keysB || []) {
        if (!a || !b) continue;
        if (a === b) return true;
        const [short, long] = a.length <= b.length ? [a, b] : [b, a];
        if (short.length >= GgufCompanionPairer.MIN_LINK_KEY_LENGTH && long.includes(short)) return true;
      }
    }
    return false;
  }

  static isDraftOf(small, big, hinted = false) {
    if (small === big) return false;
    if (!small.architecture || !big.architecture) return false;
    if (String(small.architecture).toLowerCase() !== String(big.architecture).toLowerCase()) return false;
    const ratio = GgufCompanionPairer.sizeRatio(small, big);
    if (ratio === null) return false;
    return ratio <= (hinted ? GgufCompanionPairer.DRAFT_HINTED_MAX_RATIO : GgufCompanionPairer.DRAFT_MAX_RATIO);
  }

  static sizeRatio(small, big) {
    const bySize = (a, b) => (a > 0 && b > 0 ? a / b : null);
    const byParams = bySize(Number(small.parameterCount) || 0, Number(big.parameterCount) || 0);
    if (byParams !== null) return byParams;
    return bySize(Number(small.sizeBytes) || 0, Number(big.sizeBytes) || 0);
  }

  static keysOf({ fileName, headerName, headerBaseName }) {
    const keys = [];
    for (const raw of [headerBaseName, headerName]) {
      const key = GgufCompanionPairer.normaliseKey(raw);
      if (key && !keys.includes(key)) keys.push(key);
    }
    const fileKey = fileName ? GgufFileName.familyKey(fileName) : '';
    if (fileKey && !keys.includes(fileKey)) keys.push(fileKey);
    return keys;
  }

  static normaliseKey(raw) {
    if (typeof raw !== 'string') return '';
    return raw.toLowerCase().replace(/[-_.\s]+/g, '-').replace(/^-+|-+$/g, '');
  }

  static _candidates(companion, groups) {
    const mains = groups.filter((g) => g.role === 'main');
    if (companion.kind !== 'drafter') return mains;
    if (!companion.architecture) return mains.filter((g) => GgufCompanionPairer._smallerByBytes(companion, g));
    return mains.filter((g) => GgufCompanionPairer.isDraftOf(companion, g, companion.hinted));
  }

  static _smallerByBytes(companion, group) {
    const ratio = GgufCompanionPairer.sizeRatio(companion, group);
    return ratio !== null && ratio <= GgufCompanionPairer.DRAFT_HINTED_MAX_RATIO;
  }
}

module.exports = GgufCompanionPairer;

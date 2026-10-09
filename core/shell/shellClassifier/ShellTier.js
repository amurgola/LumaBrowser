class ShellTier {
  static READONLY = 'readonly';
  static NORMAL = 'normal';
  static MASS_DESTRUCTIVE = 'mass-destructive';
  static FORBIDDEN = 'forbidden';

  static TIERS = Object.freeze([ShellTier.READONLY, ShellTier.NORMAL, ShellTier.MASS_DESTRUCTIVE, ShellTier.FORBIDDEN]);

  static isKnown(tier) {
    return ShellTier.TIERS.includes(tier);
  }

  static severity(tier) {
    return ShellTier.TIERS.indexOf(ShellTier.isKnown(tier) ? tier : ShellTier.NORMAL);
  }

  static compare(a, b) {
    return ShellTier.severity(a) - ShellTier.severity(b);
  }

  static harshest(first, ...rest) {
    return rest.reduce((kept, tier) => (ShellTier.compare(tier, kept) > 0 ? tier : kept), first);
  }

  static worst(a, b) {
    return ShellTier.harshest(a, b);
  }

  static isWorse(tier, than) {
    return ShellTier.compare(tier, than) > 0;
  }

  static isAtLeast(tier, floor) {
    return ShellTier.compare(tier, floor) >= 0;
  }

  static sortWorstFirst(verdicts) {
    return verdicts.slice().sort((x, y) => ShellTier.compare(y.tier, x.tier));
  }
}

module.exports = ShellTier;

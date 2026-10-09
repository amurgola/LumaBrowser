class RoleplayIds {
  static SEED_RANGE = 2000000000;

  static mint(prefix) {
    return prefix + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
  }

  static seed() {
    return Math.floor(Math.random() * RoleplayIds.SEED_RANGE);
  }
}

module.exports = RoleplayIds;

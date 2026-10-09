const RoleplayEnv = require('./RoleplayEnv');

class BeatKind {
  static isPainted(shot) {
    return RoleplayEnv.enabled('RP_PAINTED') && !!(shot && shot.contact);
  }

  static isDynamic(shot) {
    if (!RoleplayEnv.enabled('RP_INTEGRATED')) return false;
    if (!shot || shot.contact) return false;
    return !!(String(shot.action || '').trim() || (Array.isArray(shot.props) && shot.props.length));
  }
}

module.exports = BeatKind;

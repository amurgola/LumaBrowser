class RoleplayEnv {
  static CAST_MAX_LIMIT = 2;

  static _env() {
    return (typeof process !== 'undefined' && process.env) || {};
  }

  static enabled(name) {
    return (RoleplayEnv._env()[name] || '1') !== '0';
  }

  static number(name, fallback) {
    const v = parseFloat(RoleplayEnv._env()[name]);
    return Number.isFinite(v) ? v : fallback;
  }

  static text(name, fallback) {
    return String(RoleplayEnv._env()[name] || fallback).trim();
  }

  static castMax() {
    const v = parseInt(RoleplayEnv._env().RP_CAST_MAX || '', 10);
    return Number.isFinite(v) && v > 0 ? Math.min(v, RoleplayEnv.CAST_MAX_LIMIT) : 1;
  }

  static sceneMode() {
    return RoleplayEnv.text('RP_SCENE_MODE', 'composite');
  }

  static debug() {
    return !!RoleplayEnv._env().LUMA_RP_DEBUG;
  }

  static debugImageDir() {
    return RoleplayEnv._env().RP_DEBUG_IMG_DIR || '';
  }
}

module.exports = RoleplayEnv;

class TabKinds {
  static DEFAULT = 'user';

  static AUTOMATION = new Set(['cdp']);

  static INTERNAL = new Set(['llm', 'dashboard']);

  static INTERNAL_TAB_ID_BASE = 9000;

  static SHARED_PARTITION = 'persist:main';

  static isInternal(kind) {
    return TabKinds.INTERNAL.has(kind);
  }

  static isAutomation(kind) {
    return TabKinds.AUTOMATION.has(kind);
  }
}

module.exports = TabKinds;

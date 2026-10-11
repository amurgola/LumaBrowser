const SettingsValueStore = require('../../database/SettingsValueStore');

class SessionTabList extends SettingsValueStore {
  static STORAGE_KEY = 'core.browser.sessionTabs';

  constructor(db) {
    super(db, SessionTabList.STORAGE_KEY);
  }

  read() {
    const value = this._read();
    const tabs = value.tabs.filter((tab) => tab && typeof tab === 'object' && typeof tab.url === 'string' && tab.url);
    const activeIndex = Number.isInteger(value.activeIndex) ? value.activeIndex : -1;
    return { tabs, activeIndex };
  }

  write({ tabs, activeIndex }) {
    this._write({ tabs: tabs.map((tab) => ({ url: tab.url, title: tab.title })), activeIndex });
  }

  _emptyValue() {
    return { tabs: [], activeIndex: -1 };
  }

  _hasValidShape(value) {
    return !!value && typeof value === 'object' && Array.isArray(value.tabs);
  }
}

module.exports = SessionTabList;

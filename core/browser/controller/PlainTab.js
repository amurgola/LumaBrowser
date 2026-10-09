class PlainTab {
  static from(tab) {
    return tab && typeof tab.toJSON === 'function' ? tab.toJSON() : tab;
  }
}

module.exports = PlainTab;

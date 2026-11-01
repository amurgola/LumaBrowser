const WindowTabsFeature = require('./WindowTabsFeature');

module.exports = {
  id: 'window-tabs',
  label: 'Window tabs',
  description: 'Open any window as a live tab (Ctrl+Alt+Shift+T): the chat can read it, Tab Share can stream it, and your clicks and keys on the tab can go to the window.',
  defaultEnabled: true,
  settingsSchema: WindowTabsFeature.settingsSchema(),

  create(deps) {
    const feature = new WindowTabsFeature(deps, WindowTabsFeature.defaultParts(deps));
    feature.start();
    return feature.instance();
  },
};

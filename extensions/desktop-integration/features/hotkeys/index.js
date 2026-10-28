const HotkeysFeature = require('./HotkeysFeature');

module.exports = {
  id: 'hotkeys',
  label: 'Hotkeys',
  description: 'System-wide shortcuts (and POST /api/desktop/hotkeys/run) to read or rewrite the selected text, or send the clipboard or a screen region to a new chat.',
  defaultEnabled: true,
  settingsSchema: HotkeysFeature.settingsSchema(),

  create(deps) {
    const feature = new HotkeysFeature(deps, HotkeysFeature.defaultParts(deps));
    feature.start();
    return feature.instance();
  },
};

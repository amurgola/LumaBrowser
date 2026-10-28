const LumabyteFeature = require('./LumabyteFeature');

module.exports = {
  id: 'lumabyte',
  label: 'Lumabyte',
  description: 'Attach Luma to any window (Ctrl+Alt+Shift+A): a docked button and a panel beside the window for a conversation about what is on it.',
  defaultEnabled: true,
  settingsSchema: LumabyteFeature.settingsSchema(),

  create(deps) {
    const feature = new LumabyteFeature(deps, LumabyteFeature.defaultParts(deps));
    feature.start();
    return feature.instance();
  },
};

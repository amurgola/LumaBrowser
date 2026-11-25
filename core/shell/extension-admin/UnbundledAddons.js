const VersionCompare = require('../ide-installers/VersionCompare');

class UnbundledAddons {
  static RELEASES = [
    {
      version: '2.2.8',
      ids: [
        'cdp-driver', 'desktop-integration', 'game-mode', 'lora-trainer', 'ntfy-notifier', 'on-demand-mode',
        'page-change-detector', 'personal-hub', 'selenium-driver', 'site-apis', 'timed-tasks', 'tool-forge',
      ],
    },
  ];

  static between(previousVersion, currentVersion) {
    const ids = UnbundledAddons.RELEASES
      .filter((release) => UnbundledAddons._isAfter(release.version, previousVersion))
      .filter((release) => !UnbundledAddons._isAfter(release.version, currentVersion))
      .flatMap((release) => release.ids);
    return [...new Set(ids)];
  }

  static _isAfter(version, reference) {
    return VersionCompare.compare(version, reference) > 0;
  }
}

module.exports = UnbundledAddons;

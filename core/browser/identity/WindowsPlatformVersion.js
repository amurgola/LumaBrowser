const childProcess = require('child_process');

class WindowsPlatformVersion {
  static FALLBACK = '15.0.0';
  static FIRST_WIN10_BUILD = 10240;
  static REGISTRY_KEY = 'HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion';

  static CONTRACT_BY_BUILD = [
    [26100, 19], [22621, 15], [22000, 14], [20348, 12], [19041, 10], [18362, 8],
    [17763, 7], [17134, 6], [16299, 5], [15063, 4], [14393, 3], [10586, 2],
  ];

  static detect(platform = process.platform) {
    if (platform !== 'win32') return WindowsPlatformVersion.FALLBACK;
    return WindowsPlatformVersion.fromBuild(WindowsPlatformVersion._readBuildNumber());
  }

  static fromBuild(build) {
    if (!(build >= WindowsPlatformVersion.FIRST_WIN10_BUILD)) return WindowsPlatformVersion.FALLBACK;
    const hit = WindowsPlatformVersion.CONTRACT_BY_BUILD.find(([minBuild]) => build >= minBuild);
    return `${hit ? hit[1] : 1}.0.0`;
  }

  static parseBuildNumber(regOutput) {
    const match = /CurrentBuildNumber\s+REG_SZ\s+(\d+)/.exec(String(regOutput || ''));
    return (match && parseInt(match[1], 10)) || 0;
  }

  static _readBuildNumber() {
    try {
      const out = childProcess.execFileSync('reg', [
        'query', WindowsPlatformVersion.REGISTRY_KEY, '/v', 'CurrentBuildNumber',
      ], { encoding: 'utf8', windowsHide: true, timeout: 3000 });
      return WindowsPlatformVersion.parseBuildNumber(out);
    } catch (_) {
      return 0;
    }
  }
}

module.exports = WindowsPlatformVersion;

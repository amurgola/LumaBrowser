const fs = require('fs');
const path = require('path');

class AntiCheatDetector {
  static MARKERS = [
    { re: /^easyanticheat/i, name: 'Easy Anti-Cheat' },
    { re: /^start_protected_game\.exe$/i, name: 'Easy Anti-Cheat' },
    { re: /^battleye$/i, name: 'BattlEye' },
    { re: /^be(service|client|launcher)/i, name: 'BattlEye' },
    { re: /^punkbuster$|^pb$|^pnkbstr/i, name: 'PunkBuster' },
    { re: /^gameguard$/i, name: 'nProtect GameGuard' },
    { re: /^xigncode/i, name: 'XIGNCODE3' },
    { re: /^mhyprot/i, name: 'miHoYo anti-cheat' },
    { re: /^ace-/i, name: 'Tencent ACE' },
    { re: /^eac_launcher|^eac\.dll$/i, name: 'Easy Anti-Cheat' },
    { re: /^vgc\.exe$|^vanguard$/i, name: 'Riot Vanguard' },
    { re: /^faceit/i, name: 'FACEIT' },
  ];

  static PROTECTED_EXES = [
    { re: /^valorant(-win64-shipping)?\.exe$/i, name: 'Riot Vanguard' },
    { re: /^leagueclient|^league of legends\.exe$/i, name: 'Riot Vanguard' },
    { re: /^cs2\.exe$|^csgo\.exe$/i, name: 'Valve Anti-Cheat' },
    { re: /^r5apex(_dx12)?\.exe$/i, name: 'Easy Anti-Cheat' },
    { re: /^fortniteclient/i, name: 'Easy Anti-Cheat / BattlEye' },
    { re: /^cod(\.exe|hq)|^modernwarfare|^blackops/i, name: 'Ricochet' },
    { re: /^overwatch\.exe$/i, name: 'Blizzard anti-cheat' },
    { re: /^genshinimpact\.exe$|^starrail\.exe$|^zenlesszonezero\.exe$/i, name: 'miHoYo anti-cheat' },
  ];

  static detect(exePath, io = {}) {
    if (!exePath) return null;
    return AntiCheatDetector._byExeName(exePath)
      || AntiCheatDetector._byInstalledMarkers(exePath, io.readdir || AntiCheatDetector._readdir);
  }

  static _byExeName(exePath) {
    return AntiCheatDetector._firstMatch(AntiCheatDetector.PROTECTED_EXES, path.basename(exePath));
  }

  static _byInstalledMarkers(exePath, readdir) {
    for (const dir of AntiCheatDetector._candidateDirs(exePath)) {
      for (const entry of readdir(dir)) {
        const name = AntiCheatDetector._firstMatch(AntiCheatDetector.MARKERS, entry);
        if (name) return name;
      }
    }
    return null;
  }

  static _candidateDirs(exePath) {
    const dir = path.dirname(exePath);
    return new Set([dir, path.dirname(dir), path.dirname(path.dirname(dir))]);
  }

  static _firstMatch(patterns, name) {
    const hit = patterns.find((p) => p.re.test(name));
    return hit ? hit.name : null;
  }

  static _readdir(dir) {
    try { return fs.readdirSync(dir); } catch (_) { return []; }
  }
}

module.exports = AntiCheatDetector;

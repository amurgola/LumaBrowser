const fs = require('fs');
const os = require('os');
const path = require('path');
const CoreRequire = require('./CoreRequire');
const NinferScripts = require('./NinferScripts');
const NinferShell = require('./NinferShell');

const WslFormat = CoreRequire.load('music-server/runtimes/WslFormat');

class NinferToolchain {
  static FFMPEG_MISSING = 'FFmpeg dev libs (libavformat-dev libavcodec-dev libavutil-dev libswscale-dev)';

  static async check(mode, distro, managedDir) {
    const dir = managedDir || fs.mkdtempSync(path.join(os.tmpdir(), 'ninfer-probe-'));
    const script = NinferScripts.write(dir, 'probe-toolchain.sh', NinferScripts.TOOLCHAIN_PROBE, mode);
    const r = await NinferShell.run(mode, distro, `bash ${WslFormat.shellQuote(script)}`, { timeout: NinferShell.PROBE_TIMEOUT_MS });
    const out = NinferToolchain.parseOutput(r.stdout);
    if (!r.ok && Object.keys(out.found).length === 0) out.probeError = String(r.stderr || r.reason || '').trim().slice(0, 300);
    return out;
  }

  static parseOutput(stdout) {
    const found = NinferToolchain._keyValues(stdout);
    const missing = NinferToolchain._missing(found);
    return { ok: missing.length === 0, missing, found };
  }

  static _keyValues(stdout) {
    const kv = {};
    for (const line of String(stdout || '').split(/\r?\n/)) {
      const m = line.match(/^(\w+)=(.*)$/);
      if (m) kv[m[1]] = m[2].trim();
    }
    return kv;
  }

  static _missing(kv) {
    const missing = [];
    if (!NinferToolchain._atLeast((kv.nvcc || '').match(/release (\d+)\.(\d+)/), 13, 1)) missing.push('CUDA Toolkit 13.1+ (nvcc)');
    if (!NinferToolchain._atLeast((kv.cmake || '').match(/^(\d+)\.(\d+)/), 3, 28)) missing.push('cmake 3.28+');
    if (!kv.gxx) missing.push('g++ (C++20)');
    if (!kv.ninja) missing.push('ninja-build');
    if (!kv.git) missing.push('git');
    if (!kv.pkgconfig) missing.push('pkg-config');
    if (!kv.ffmpeg) missing.push(NinferToolchain.FFMPEG_MISSING);
    if (!kv.curl) missing.push('libcurl4-openssl-dev');
    return missing;
  }

  static _atLeast(match, major, minor) {
    if (!match) return false;
    const [maj, min] = [Number(match[1]), Number(match[2])];
    return maj > major || (maj === major && min >= minor);
  }
}

module.exports = NinferToolchain;

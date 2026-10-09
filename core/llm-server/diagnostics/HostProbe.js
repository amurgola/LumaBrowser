const os = require('os');

class HostProbe {
  static platform() {
    return { os: process.platform, arch: process.arch, release: os.release(), hostname: os.hostname() };
  }

  static memory() {
    return { totalBytes: os.totalmem(), freeBytes: os.freemem() };
  }

  static cpu() {
    const cpus = os.cpus() || [];
    const first = cpus[0] || {};
    return {
      model: (first.model || 'Unknown').trim().replace(/\s+/g, ' '),
      speedMHz: first.speed || 0,
      logicalCores: cpus.length,
    };
  }
}

module.exports = HostProbe;

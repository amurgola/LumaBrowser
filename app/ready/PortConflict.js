const http = require('http');
const { execFile } = require('child_process');

class PortConflict {
  static LUMABROWSER = 'lumabrowser';
  static OTHER = 'other';
  static UNKNOWN = 'unknown';
  static PROBE_TIMEOUT_MS = 1500;
  static OWNER_TIMEOUT_MS = 3000;
  static HEALTH_APP = 'LumaBrowser';

  static async inspect(port, { probe = PortConflict.probeHealth, owner = PortConflict.findOwner } = {}) {
    const health = await probe(port).catch(() => null);
    if (health && health.app === PortConflict.HEALTH_APP) return { kind: PortConflict.LUMABROWSER, owner: null, health };
    const who = await owner(port).catch(() => null);
    return { kind: who ? PortConflict.OTHER : PortConflict.UNKNOWN, owner: who, health: null };
  }

  static probeHealth(port) {
    return new Promise((resolve) => {
      const req = http.get({ host: '127.0.0.1', port, path: '/api/health', timeout: PortConflict.PROBE_TIMEOUT_MS }, (res) => {
        let body = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => { if (body.length < 65536) body += chunk; });
        res.on('end', () => { try { resolve(JSON.parse(body)); } catch (_) { resolve(null); } });
      });
      req.on('timeout', () => { req.destroy(); resolve(null); });
      req.on('error', () => resolve(null));
    });
  }

  static findOwner(port, { platform = process.platform, run = PortConflict._run } = {}) {
    const n = Number(port);
    if (!Number.isInteger(n) || n <= 0) return Promise.resolve(null);
    const cmd = platform === 'win32' ? PortConflict._windowsCommand(n) : PortConflict._unixCommand(n);
    return run(cmd.file, cmd.args).then((out) => PortConflict.parseOwner(out, platform)).catch(() => null);
  }

  static _windowsCommand(port) {
    const script = `$c = Get-NetTCPConnection -LocalPort ${port} -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1; `
      + 'if ($c) { $p = Get-Process -Id $c.OwningProcess -ErrorAction SilentlyContinue; if ($p) { Write-Output ($p.ProcessName + "|" + $p.Id) } }';
    return { file: 'powershell.exe', args: ['-NoProfile', '-NonInteractive', '-Command', script] };
  }

  static _unixCommand(port) {
    return { file: 'lsof', args: ['-nP', `-iTCP:${port}`, '-sTCP:LISTEN', '-Fpc'] };
  }

  static parseOwner(out, platform) {
    const text = String(out || '').trim();
    if (!text) return null;
    if (platform === 'win32') {
      const [name, pid] = text.split('\n')[0].trim().split('|');
      return name ? `${name}${pid ? ` (${pid})` : ''}` : null;
    }
    let pid = null;
    let name = null;
    for (const line of text.split('\n')) {
      if (line.startsWith('p') && pid === null) pid = line.slice(1).trim();
      if (line.startsWith('c') && name === null) name = line.slice(1).trim();
      if (pid !== null && name !== null) break;
    }
    return name ? `${name}${pid ? ` (${pid})` : ''}` : null;
  }

  static _run(file, args) {
    return new Promise((resolve, reject) => {
      execFile(file, args, { timeout: PortConflict.OWNER_TIMEOUT_MS, windowsHide: true }, (err, stdout) => {
        if (err) reject(err);
        else resolve(stdout);
      });
    });
  }
}

module.exports = PortConflict;

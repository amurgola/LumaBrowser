const os = require('os');
const path = require('path');
const HfHubClient = require('../../core/llm-server/models/HfHubClient');
const ModelDownload = require('../../core/llm-server/models/ModelDownload');

class HfDownloadCli {
  static USAGE = [
    'Usage: npm run model:download -- <owner/repo> <file> [options]',
    '',
    '  --dir <path>         models root (default %USERPROFILE%/.lmstudio/models); the file lands in <dir>/<owner>__<repo>/',
    '  --dest <path>        the exact destination file instead',
    '  --revision <rev>     repo revision (default main)',
    '  --help',
  ].join('\n');
  static PROGRESS_EVERY_MS = 5000;

  constructor(deps = {}) {
    this._hub = deps.hub || HfHubClient;
    this._download = deps.download || ((opts) => ModelDownload.start(opts));
    this._log = deps.log || ((line) => process.stdout.write(line + '\n'));
    this._now = deps.now || Date.now;
  }

  static parse(argv) {
    const o = { repo: '', file: '', dir: path.join(os.homedir(), '.lmstudio', 'models'), dest: '', revision: 'main', help: false };
    const list = Array.isArray(argv) ? argv : [];
    const positional = [];
    for (let i = 0; i < list.length; i += 1) {
      const a = list[i];
      const next = () => { i += 1; return list[i]; };
      if (a === '--help' || a === '-h') o.help = true;
      else if (a === '--dir') o.dir = String(next() || o.dir);
      else if (a === '--dest') o.dest = String(next() || '');
      else if (a === '--revision') o.revision = String(next() || o.revision);
      else if (a.startsWith('--')) throw new Error('unknown option ' + a + '\n' + HfDownloadCli.USAGE);
      else positional.push(a);
    }
    if (o.help) return o;
    if (positional.length < 2) throw new Error('a repo and a file are required\n' + HfDownloadCli.USAGE);
    o.repo = HfHubClient.requireRepoId(positional[0]);
    o.file = positional[1];
    return o;
  }

  static destination(o) {
    if (o.dest) return path.resolve(o.dest);
    return path.join(path.resolve(o.dir), o.repo.replace('/', '__'), path.basename(o.file));
  }

  async listing(o) {
    const res = await this._hub.get(HfHubClient.treeUrl(o.repo, o.revision), { attempts: 3 });
    const rows = Array.isArray(res) ? res : (Array.isArray(res && res.data) ? res.data : []);
    const row = rows.find((r) => r && r.path === o.file);
    if (!row) throw new Error('no file ' + o.file + ' in ' + o.repo + ' (' + rows.filter((r) => r && r.path).map((r) => r.path).join(', ') + ')');
    const lfs = row.lfs && typeof row.lfs === 'object' ? row.lfs : null;
    return { size: Number(row.size) || (lfs && Number(lfs.size)) || 0, sha256: lfs && typeof lfs.oid === 'string' && lfs.oid.length === 64 ? lfs.oid : null };
  }

  async execute(argv) {
    const o = HfDownloadCli.parse(argv);
    if (o.help) { this._log(HfDownloadCli.USAGE); return null; }
    const destPath = HfDownloadCli.destination(o);
    const { size, sha256 } = await this.listing(o);
    this._log('downloading ' + o.repo + '/' + o.file + ' (' + HfDownloadCli.gb(size) + ')' + (sha256 ? ', sha256 ' + sha256.slice(0, 12) + '...' : '') + ' -> ' + destPath);
    let last = 0;
    const handle = this._download({
      url: HfHubClient.fileUrl(o.repo, o.file, o.revision),
      destPath,
      expectedSize: size,
      expectedSha256: sha256,
      onEvent: (type, p) => {
        if (type === 'resume') this._log('resuming from ' + HfDownloadCli.gb(p.have));
        else if (type === 'download' && this._now() - last >= HfDownloadCli.PROGRESS_EVERY_MS) {
          last = this._now();
          this._log('  ' + HfDownloadCli.gb(p.received) + ' of ' + HfDownloadCli.gb(p.total) + (p.bytesPerSec ? ' at ' + (p.bytesPerSec / 1e6).toFixed(0) + ' MB/s' : '') + (p.etaMs ? ', ' + Math.round(p.etaMs / 1000) + ' s left' : ''));
        } else if (type === 'verify' && p.read === p.total) this._log('verified');
      },
    });
    const result = await handle.promise;
    if (!result || !result.success) throw new Error('download ' + (result && result.canceled ? 'canceled' : 'failed') + (result && result.error ? ': ' + result.error : ''));
    this._log('done: ' + destPath + ' (' + HfDownloadCli.gb(result.bytes || size) + ')');
    return { destPath, bytes: result.bytes || size, sha256 };
  }

  static gb(bytes) {
    return (Number(bytes || 0) / 1e9).toFixed(2) + ' GB';
  }
}

module.exports = HfDownloadCli;

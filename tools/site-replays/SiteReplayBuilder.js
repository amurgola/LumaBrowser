const fs = require('fs');
const os = require('os');
const path = require('path');
const DevReplayScenario = require('./DevReplayScenario');
const CliSessionRecorder = require('./CliSessionRecorder');
const IdePageInliner = require('./IdePageInliner');

class SiteReplayBuilder {
  static OUT_DIR = 'tmp/site-dev-replays/dev';
  static HOME = '/home/dev';
  static CWD = '/home/dev/projects/storefront';
  static SIZES = { wide: { cols: 104, rows: 30 }, narrow: { cols: 56, rows: 34 } };
  static SITE_BRIDGE = '<script>window.__lumaSend = function (s) { if (window.__lumaHost) window.__lumaHost(s); };</script>';
  static PLAYER_FILE = 'demo-replay.js';

  constructor(root, { log, error, recorder } = {}) {
    this._root = root;
    this._log = log || ((m) => console.log(m));
    this._error = error || ((m) => console.error(m));
    this._recorder = recorder || ((size) => new CliSessionRecorder({ scenario: DevReplayScenario, cwd: SiteReplayBuilder.CWD }).record(size));
  }

  async execute(args) {
    this._readArgs(args);
    SiteReplayBuilder.pinEnvironment();
    fs.mkdirSync(this._out, { recursive: true });
    const [wide, narrow] = await Promise.all([this._recorder(SiteReplayBuilder.SIZES.wide), this._recorder(SiteReplayBuilder.SIZES.narrow)]);
    this._writeOutputs(wide, narrow);
    return this._site ? this._copyToSite() : 0;
  }

  static pinEnvironment() {
    process.env.LUMA_CLI_THEME = 'dark';
    os.homedir = () => SiteReplayBuilder.HOME;
  }

  static ideTurn() {
    const s = DevReplayScenario;
    return {
      prompt: s.PROMPT,
      suggestion: s.SUGGESTION,
      state: {
        status: 'ready', statusMessage: '', agent: { id: s.AGENT.id, name: 'Reviewer' }, model: s.MODEL,
        root: 'storefront', approval: 'ask', streaming: false, resumedMessages: 0, conversationId: 'conv_storefront',
        showReasoning: false, suggest: true, ideName: 'WebStorm', context: [],
      },
      file: { path: 'src/cart.js', text: s.CART_JS, oldLine: s.OLD_LINE, newLine: s.NEW_LINE },
      timeline: s.timeline(),
    };
  }

  _readArgs(args) {
    const value = (flag) => { const i = args.indexOf(flag); return i >= 0 && args[i + 1] ? path.resolve(args[i + 1]) : null; };
    this._out = value('--out') || path.join(this._root, SiteReplayBuilder.OUT_DIR);
    this._site = value('--site');
  }

  _writeOutputs(wide, narrow) {
    this._put('cli-wide.json', JSON.stringify(wide));
    this._put('cli-narrow.json', JSON.stringify(narrow));
    this._put('ide-page.html', IdePageInliner.build(this._root, SiteReplayBuilder.SITE_BRIDGE));
    this._put('ide-turn.json', JSON.stringify(SiteReplayBuilder.ideTurn()));
    this._log(`built -> ${this._out}  (cli ${Math.round(wide.duration / 1000)}s, ${wide.events.length} writes)`);
  }

  _put(name, body) {
    fs.writeFileSync(path.join(this._out, name), body);
    this._log(`  ${name}  ${(Buffer.byteLength(body) / 1024).toFixed(1)} KB`);
  }

  _copyToSite() {
    if (!fs.existsSync(this._site)) { this._error(`--site: ${this._site} does not exist`); return 1; }
    fs.cpSync(this._out, path.join(this._site, 'dev'), { recursive: true });
    const player = path.join(this._out, '..', SiteReplayBuilder.PLAYER_FILE);
    if (fs.existsSync(player)) fs.copyFileSync(player, path.join(this._site, SiteReplayBuilder.PLAYER_FILE));
    this._log(`copied -> ${path.join(this._site, 'dev')}`);
    return 0;
  }
}

module.exports = SiteReplayBuilder;

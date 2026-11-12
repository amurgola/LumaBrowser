const fs = require('fs');
const path = require('path');
const IdeDemoTurn = require('./IdeDemoTurn');

class IdeWebviewDemo {
  static VIEWPORT = { width: 420, height: 760 };

  constructor(root, defaultOut, { log, error } = {}) {
    this._root = root;
    this._defaultOut = defaultOut;
    this._log = log || ((m) => console.log(m));
    this._error = error || ((m) => console.error(m));
    this.problems = [];
  }

  async execute(args) {
    this.configure(args);
    fs.mkdirSync(this.outDir, { recursive: true });
    const result = await this._runInBrowser();
    fs.writeFileSync(path.join(this.outDir, 'sent.json'), JSON.stringify(result.sent, null, 2));
    return this._report(result);
  }

  async _openPage(_page) { throw new Error(`${this.constructor.name} must implement _openPage(page)`); }

  async _dispatch(_page, _msg) { throw new Error(`${this.constructor.name} must implement _dispatch(page, msg)`); }

  async _sentMessages(_page) { throw new Error(`${this.constructor.name} must implement _sentMessages(page)`); }

  verify(_result) { throw new Error(`${this.constructor.name} must implement verify(result)`); }

  async _applyTheme(_page) {}

  async _probe(_page) { return null; }

  async _closeHost() {}

  pageState(over) {
    return IdeDemoTurn.state(over);
  }

  configure(args) {
    const i = args.indexOf('--out');
    this.light = args.includes('--light');
    this.outDir = i >= 0 && args[i + 1] ? path.resolve(args[i + 1]) : path.join(this._root, this._defaultOut);
  }

  async _runInBrowser() {
    const { chromium } = require('playwright');
    const browser = await chromium.launch({ channel: 'msedge', headless: true });
    try {
      const page = await browser.newPage({ viewport: IdeWebviewDemo.VIEWPORT });
      this._watchProblems(page);
      await this._openPage(page);
      await this._driveTurn(page);
      return { sent: await this._sentMessages(page), probe: await this._probe(page) };
    } finally {
      await browser.close();
      await this._closeHost();
    }
  }

  _watchProblems(page) {
    page.on('pageerror', (e) => this.problems.push(`page error: ${e.message}`));
    page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') this.problems.push(`console ${m.type()}: ${m.text()}`); });
  }

  async _driveTurn(page) {
    await this._applyTheme(page);
    await this._showIdle(page);
    await this._sendPrompt(page);
    await this._replayFrames(page);
    await this._showDone(page);
  }

  async _showIdle(page) {
    await this._dispatch(page, { kind: 'state', state: this.pageState({ status: 'offline', statusMessage: '' }) });
    await IdeWebviewDemo.sleep(60);
    await this._shot(page, '1-offline.png');
    await this._dispatch(page, { kind: 'state', state: this.pageState({ context: IdeDemoTurn.CONTEXT }) });
    await IdeWebviewDemo.sleep(60);
    await this._shot(page, '2-ready.png');
  }

  async _sendPrompt(page) {
    await page.fill('#input', IdeDemoTurn.PROMPT);
    await page.press('#input', 'Enter');
    await IdeWebviewDemo.sleep(50);
    await this._dispatch(page, { kind: 'state', state: this.pageState({ streaming: true, context: [] }) });
    await this._dispatch(page, { kind: 'frame', type: 'meta', payload: { conversationId: 'conv_1' } });
  }

  async _replayFrames(page) {
    for (const [type, payload] of IdeDemoTurn.TURN) {
      await this._dispatch(page, { kind: 'frame', type, payload });
      if (type === 'tool' && payload.phase === 'approval') await this._approve(page);
      await IdeWebviewDemo.sleep(25);
    }
  }

  async _approve(page) {
    await IdeWebviewDemo.sleep(80);
    await this._shot(page, '3-approval.png');
    await page.keyboard.press('y');
  }

  async _showDone(page) {
    await this._dispatch(page, { kind: 'state', state: this.pageState({ streaming: false }) });
    await IdeWebviewDemo.sleep(150);
    await this._shot(page, '4-done.png');
    await page.evaluate(() => { document.getElementById('scroller').scrollTop = 0; });
    await this._shot(page, '5-done-top.png');
  }

  _shot(page, name) {
    return page.screenshot({ path: path.join(this.outDir, name) });
  }

  _report(result) {
    this._log(`page messages: ${result.sent.map((m) => m.type).join(', ')}`);
    if (result.probe) this._log(`theme probe: ${JSON.stringify(result.probe)}`);
    this._log(`screenshots in ${this.outDir}`);
    for (const p of this.problems) this._error(`[page] ${p}`);
    const failures = this.verify(result);
    for (const f of failures) this._error(`FAIL: ${f}`);
    if (!failures.length) this._log('ok');
    return failures.length ? 1 : 0;
  }

  static missingMessages(sent) {
    const types = sent.map((m) => m.type);
    return ['ready', 'prompt', 'approve'].filter((t) => !types.includes(t)).map((t) => `the page never sent "${t}"`);
  }

  static sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }
}

module.exports = IdeWebviewDemo;

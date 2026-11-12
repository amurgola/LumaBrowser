class TabChurnDriver {
  static URLS = [
    'https://example.com', 'https://en.wikipedia.org/wiki/Special:Random',
    'https://news.ycombinator.com', 'https://www.youtube.com', 'https://github.com',
  ];
  static START_DELAY_MS = 2500;
  static REQUEST_TIMEOUT_MS = 4000;

  constructor({ port, fetchImpl = fetch, sleep = TabChurnDriver._sleep, urls = TabChurnDriver.URLS }) {
    this._api = `http://127.0.0.1:${port}/api/browser`;
    this._fetch = fetchImpl;
    this._sleep = sleep;
    this._urls = urls;
  }

  async run(child, log, stopAt, now = Date.now) {
    const stats = { ops: 0, errs: 0, next: 0 };
    await this._sleep(TabChurnDriver.START_DELAY_MS);
    while (now() < stopAt && child.exitCode === null) {
      await this._cycle(stats);
      await this._sleep(250);
    }
    log(`[drive] ${stats.ops} ops, ${stats.errs} errors\n`);
    return stats;
  }

  async _cycle(stats) {
    try {
      const id = await this._createTab(stats);
      if (id !== undefined) await this._activateAndClose(id, stats);
    } catch (_) {
      stats.errs++;
      await this._sleep(500);
    }
  }

  async _createTab(stats) {
    const created = await this._call('POST', '/tabs', { url: this._urls[stats.next++ % this._urls.length] });
    stats.ops++;
    return TabChurnDriver.tabId(created);
  }

  async _activateAndClose(id, stats) {
    await this._sleep(300);
    await this._call('POST', `/tabs/${id}/activate`);
    await this._sleep(300);
    await this._call('POST', '/tabs/0/activate');
    await this._sleep(200);
    await this._call('DELETE', `/tabs/${id}`);
    stats.ops += 3;
  }

  static tabId(created) {
    const d = created && created.data;
    if (!d) return undefined;
    return d.id !== undefined ? d.id : d.tab && d.tab.id;
  }

  async _call(method, route, body) {
    const r = await this._fetch(this._api + route, {
      method,
      headers: { 'content-type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(TabChurnDriver.REQUEST_TIMEOUT_MS),
    });
    return r.json().catch(() => ({}));
  }

  static _sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }
}

module.exports = TabChurnDriver;

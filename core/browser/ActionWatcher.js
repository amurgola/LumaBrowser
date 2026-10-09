const ActionEvidence = require('./ActionEvidence');
const ActionEvidenceScripts = require('./ActionEvidenceScripts');
const PageSettler = require('./PageSettler');

class ActionWatcher {
  static NAV_GRACE_MS = 3000;
  static NO_ANSWER_GRACE_MS = 1000;

  constructor(wc, { tabId, tabViewManager } = {}) {
    this._wc = wc;
    this._tabId = tabId;
    this._tabViewManager = ActionWatcher._canListen(tabViewManager) ? tabViewManager : null;
    this._stopped = false;
    this.state = { started: false, committed: false, inPage: false, newTabs: [] };
    this._committed = new Promise((resolve) => { this._resolveCommit = resolve; });
    this._bindListeners();
    this._attach();
  }

  cancel(before) {
    if (ActionEvidence.isFingerprint(before)) this._teardownPageObserver();
    if (this._stopped) return;
    this._stopped = true;
    this._detach();
  }

  async finish(options = {}) {
    const startedAt = Date.now();
    try {
      if (!ActionEvidence.isFingerprint(options.before)) return await this._finishWithoutEvidence(options);
      const settleInfo = await this._settle(options);
      await this._awaitPendingNavigation(startedAt);
      const after = await this._takeAfterSnapshot(startedAt);
      const evidence = this._buildEvidence(options.before, after, settleInfo);
      return { navigated: this.state.committed, evidence, after: ActionEvidence.isFingerprint(after) ? after : null };
    } finally {
      this.cancel();
    }
  }

  _bindListeners() {
    this._onStart = (_e, _url, isInPlace, isMainFrame) => {
      if (isMainFrame !== false && !isInPlace) this.state.started = true;
    };
    this._onNavigate = () => {
      this.state.committed = true;
      this.state.inPage = false;
      this._resolveCommit(true);
    };
    this._onNavigateInPage = (_e, _url, isMainFrame) => {
      if (isMainFrame === false) return;
      if (!this.state.committed) this.state.inPage = true;
      this.state.committed = true;
      this._resolveCommit(true);
    };
    this._onTabCreated = (tab) => this._recordNewTab(tab);
  }

  _attach() {
    if (ActionWatcher._hasMethod(this._wc, 'on')) {
      this._wc.on('did-start-navigation', this._onStart);
      this._wc.on('did-navigate', this._onNavigate);
      this._wc.on('did-navigate-in-page', this._onNavigateInPage);
    }
    if (this._tabViewManager) this._tabViewManager.on('tabCreated', this._onTabCreated);
  }

  _detach() {
    if (ActionWatcher._hasMethod(this._wc, 'removeListener')) {
      this._wc.removeListener('did-start-navigation', this._onStart);
      this._wc.removeListener('did-navigate', this._onNavigate);
      this._wc.removeListener('did-navigate-in-page', this._onNavigateInPage);
    }
    if (this._tabViewManager) this._tabViewManager.removeListener('tabCreated', this._onTabCreated);
  }

  _recordNewTab(tab) {
    if (!tab || this._tabId == null) return;
    if (Number(tab.openerTabId) === Number(this._tabId)) this.state.newTabs.push({ id: tab.id, url: tab.url || '' });
  }

  _teardownPageObserver() {
    PageSettler.runBounded(this._wc, ActionEvidenceScripts.finalScript({ fingerprint: false })).catch(() => {});
  }

  async _finishWithoutEvidence(options) {
    const navigated = await this._waitCommit(options.legacyWaitMs || 0);
    return { navigated, evidence: null, after: null };
  }

  _settle(options) {
    return PageSettler.settle(this._wc, {
      quietMs: options.quietMs,
      maxMs: options.maxMs,
      shouldStop: () => this._isCrossDocument(),
    });
  }

  async _awaitPendingNavigation(startedAt) {
    if (this.state.started && !this.state.committed) {
      await this._waitCommit(ActionWatcher.NAV_GRACE_MS - (Date.now() - startedAt));
    }
  }

  async _takeAfterSnapshot(startedAt) {
    if (this._isCrossDocument()) return null;
    const after = await PageSettler.runBounded(this._wc, ActionEvidenceScripts.finalScript());
    if (!after && !this.state.committed) {
      await this._waitCommit(Math.min(ActionWatcher.NO_ANSWER_GRACE_MS, ActionWatcher.NAV_GRACE_MS - (Date.now() - startedAt)));
    }
    return after;
  }

  _buildEvidence(before, after, settleInfo) {
    return ActionEvidence.compare(before, after, {
      navigated: this.state.committed,
      inPage: this.state.inPage,
      url: this._currentUrl(),
      newTabs: this.state.newTabs,
      settle: settleInfo,
    });
  }

  _isCrossDocument() {
    return this.state.committed && !this.state.inPage;
  }

  _currentUrl() {
    try {
      return this._wc.getURL();
    } catch (_) {
      return null;
    }
  }

  async _waitCommit(ms) {
    if (this.state.committed) return true;
    if (!(ms > 0)) return false;
    let timer;
    const timeout = new Promise((resolve) => { timer = setTimeout(() => resolve(false), ms); });
    const committed = await Promise.race([this._committed, timeout]);
    clearTimeout(timer);
    return !!committed;
  }

  static _hasMethod(target, name) {
    return !!target && typeof target[name] === 'function';
  }

  static _canListen(emitter) {
    return ActionWatcher._hasMethod(emitter, 'on') && ActionWatcher._hasMethod(emitter, 'removeListener');
  }
}

module.exports = ActionWatcher;

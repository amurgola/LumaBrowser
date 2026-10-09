class NavigationGenerations {
  static ABORT_CODES = new Set([-3, 0]);

  static fresh() {
    return { navGen: 0, committedGen: 0, pendingGen: null, pendingUrl: null, committedUrl: null };
  }

  static decide(nav, kind, payload = {}) {
    const state = NavigationGenerations._copy(nav);
    switch (kind) {
      case 'start': return NavigationGenerations._start(state, payload);
      case 'redirect': return NavigationGenerations._redirect(state, payload);
      case 'commit': return NavigationGenerations._commit(state, payload);
      case 'fail': return NavigationGenerations._fail(state, payload);
      case 'finish':
      case 'stop': return NavigationGenerations._settle(state, payload);
      case 'inPage': return NavigationGenerations._inPage(state, payload);
      case 'title': return NavigationGenerations._title(state);
      default: return { apply: true, nav: state };
    }
  }

  static normalizeUrl(url) {
    if (typeof url !== 'string' || !url) return '';
    try { return new URL(url).href; } catch (_) { return url; }
  }

  static _copy(nav) {
    return {
      navGen: (nav && nav.navGen) | 0,
      committedGen: (nav && nav.committedGen) | 0,
      pendingGen: nav && nav.pendingGen != null ? nav.pendingGen : null,
      pendingUrl: (nav && nav.pendingUrl) || null,
      committedUrl: (nav && nav.committedUrl) || null,
    };
  }

  static _isPending(state) {
    return state.pendingGen != null;
  }

  static _skip(state, reason) {
    return { apply: false, reason, nav: state };
  }

  static _start(state, { url, isMainFrame, isSameDocument }) {
    if (!isMainFrame) return NavigationGenerations._skip(state, 'subframe');
    if (isSameDocument) return NavigationGenerations._skip(state, 'same-document');
    state.navGen += 1;
    state.pendingGen = state.navGen;
    state.pendingUrl = NavigationGenerations.normalizeUrl(url) || null;
    return { apply: true, gen: state.navGen, nav: state };
  }

  static _redirect(state, { url, isMainFrame }) {
    const pending = NavigationGenerations._isPending(state);
    if (!isMainFrame || !pending) return NavigationGenerations._skip(state, pending ? 'subframe' : 'nothing pending');
    state.pendingUrl = NavigationGenerations.normalizeUrl(url) || state.pendingUrl;
    return { apply: true, gen: state.pendingGen, nav: state };
  }

  static _commit(state, { url }) {
    state.committedGen = state.navGen;
    state.committedUrl = NavigationGenerations.normalizeUrl(url) || state.committedUrl;
    state.pendingGen = null;
    state.pendingUrl = null;
    return { apply: true, gen: state.committedGen, nav: state };
  }

  static _fail(state, { url, errorCode, isMainFrame }) {
    if (!isMainFrame) return NavigationGenerations._skip(state, 'subframe');
    const pending = NavigationGenerations._isPending(state);
    const failedUrl = NavigationGenerations.normalizeUrl(url);
    const matchesPending = pending && (!failedUrl || !state.pendingUrl || failedUrl === state.pendingUrl);
    const matchesCommitted = !failedUrl || !state.committedUrl || failedUrl === state.committedUrl;
    if (pending && !matchesPending) return NavigationGenerations._skip(state, 'stale: a newer navigation is in flight');
    if (!pending && !matchesCommitted) return NavigationGenerations._skip(state, 'stale: a newer document committed');
    const gen = pending ? state.pendingGen : state.committedGen;
    if (matchesPending) { state.pendingGen = null; state.pendingUrl = null; }
    const aborted = NavigationGenerations.ABORT_CODES.has(errorCode);
    return { apply: !aborted, gen, reason: aborted ? 'aborted' : undefined, nav: state };
  }

  static _settle(state, { isLoading }) {
    if (NavigationGenerations._isPending(state) && isLoading) {
      return NavigationGenerations._skip(state, 'stale: a newer navigation is still loading');
    }
    return { apply: true, gen: state.committedGen, nav: state };
  }

  static _inPage(state, { url, isMainFrame }) {
    if (!isMainFrame) return NavigationGenerations._skip(state, 'subframe');
    if (NavigationGenerations._isPending(state)) {
      return NavigationGenerations._skip(state, 'stale: a newer document navigation is pending');
    }
    state.committedUrl = NavigationGenerations.normalizeUrl(url) || state.committedUrl;
    return { apply: true, gen: state.committedGen, nav: state };
  }

  static _title(state) {
    if (NavigationGenerations._isPending(state)) {
      return NavigationGenerations._skip(state, 'stale: a newer document navigation is pending');
    }
    return { apply: true, gen: state.committedGen, nav: state };
  }
}

module.exports = NavigationGenerations;

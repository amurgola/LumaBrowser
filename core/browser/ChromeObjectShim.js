class ChromeObjectShim {
  static SOURCE = `(function () {
  // At document start Electron has not created window.chrome yet, so create
  // it as Chrome's own: a plain writable/configurable data property on window.
  if (!window.chrome) window.chrome = {};
  var c = window.chrome;
  if (typeof c !== 'object') return;
  function nativeLike(target, impl) {
    return new Proxy(target, { apply: function (t, self, args) { return impl.apply(self, args); } });
  }
  function nav() {
    var e = performance.getEntriesByType && performance.getEntriesByType('navigation')[0];
    return e || {};
  }
  function proto() { return nav().nextHopProtocol || 'http/1.1'; }
  function sec(ms) { return (performance.timeOrigin + (ms || 0)) / 1000; }
  if (!('loadTimes' in c)) {
    c.loadTimes = nativeLike(function () {}, function () {
      var n = nav(), p = proto();
      var paint = (performance.getEntriesByType && performance.getEntriesByType('paint')[0]) || null;
      var spdy = p === 'h2' || p === 'h3';
      return {
        requestTime: sec(n.startTime), startLoadTime: sec(n.startTime),
        commitLoadTime: sec(n.responseStart), finishDocumentLoadTime: sec(n.domContentLoadedEventEnd),
        finishLoadTime: sec(n.loadEventEnd), firstPaintTime: paint ? sec(paint.startTime) : 0,
        firstPaintAfterLoadTime: 0, navigationType: 'Other',
        wasFetchedViaSpdy: spdy, wasNpnNegotiated: spdy,
        npnNegotiatedProtocol: spdy ? p : 'unknown',
        wasAlternateProtocolAvailable: false, connectionInfo: p,
      };
    });
  }
  if (!('csi' in c)) {
    c.csi = nativeLike(function () {}, function () {
      var n = nav();
      return {
        startE: Math.round(performance.timeOrigin),
        onloadT: Math.round(performance.timeOrigin + (n.domContentLoadedEventEnd || 0)),
        pageT: performance.now(), tran: 15,
      };
    });
  }
  if (!('app' in c)) {
    c.app = {
      isInstalled: false,
      InstallState: { DISABLED: 'disabled', INSTALLED: 'installed', NOT_INSTALLED: 'not_installed' },
      RunningState: { CANNOT_RUN: 'cannot_run', READY_TO_RUN: 'ready_to_run', RUNNING: 'running' },
      getDetails: nativeLike(function getDetails() {}, function () { return null; }),
      getIsInstalled: nativeLike(function getIsInstalled() {}, function () { return false; }),
      installState: nativeLike(function installState() {}, function (cb) {
        if (typeof cb === 'function') setTimeout(function () { cb('not_installed'); }, 0);
      }),
      runningState: nativeLike(function runningState() {}, function () { return 'cannot_run'; }),
    };
  }
})();`;
}

module.exports = ChromeObjectShim;

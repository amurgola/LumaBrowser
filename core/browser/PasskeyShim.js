class PasskeyShim {
  static SOURCE = `(function() {
  try {
    if (window.__lumaPasskeyShim) return;
    Object.defineProperty(window, '__lumaPasskeyShim', { value: true });
    var creds = navigator.credentials;
    if (!creds || typeof creds.get !== 'function') return;
    var PKC = window.PublicKeyCredential;
    if (PKC && typeof PKC.isConditionalMediationAvailable === 'function') {
      PKC.isConditionalMediationAvailable = function() { return Promise.resolve(false); };
    }
    var nativeGet = creds.get.bind(creds);
    var patched = function get(options) {
      var o = options || {};
      var passkey = !!o.publicKey;
      var gesture = !!(navigator.userActivation && navigator.userActivation.isActive);
      if (passkey && (o.mediation === 'conditional' || !gesture)) {
        return new Promise(function(_resolve, reject) {
          var sig = o.signal;
          if (sig) {
            if (sig.aborted) { reject(sig.reason || new DOMException('The operation was aborted.', 'AbortError')); return; }
            sig.addEventListener('abort', function() {
              reject(sig.reason || new DOMException('The operation was aborted.', 'AbortError'));
            }, { once: true });
          }
        });
      }
      return nativeGet(options);
    };
    try {
      Object.defineProperty(patched, 'toString', { value: function() { return 'function get() { [native code] }'; } });
    } catch (_) {}
    creds.get = patched;
  } catch (_) { /* never break the page */ }
})();`;
}

module.exports = PasskeyShim;

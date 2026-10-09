const OriginPolicy = require('../../OriginPolicy');
const SharingCredentialReader = require('../SharingCredentialReader');

class SharingAuth {
  static DISABLED = 'Network Sharing is disabled on the host';
  static BAD_CREDENTIAL = 'Invalid or missing credential';

  constructor(service) {
    this._service = service;
    this.originPolicy = (req, res, next) => this._originPolicy(req, res, next);
    this.requireEnabled = (req, res, next) => this._requireEnabled(req, res, next);
    this.requireToken = (req, res, next) => this._requireToken(req, res, next);
  }

  requireBrowserCredential({ as = 'json' } = {}) {
    return (req, res, next) => {
      const fail = (status, message) => (as === 'text' ? res.status(status).send(message) : res.status(status).json({ error: message }));
      if (!this._service.isEnabled()) return fail(503, SharingAuth.DISABLED);
      return this._authenticate(req, SharingCredentialReader.browser(req), next, () => fail(401, SharingAuth.BAD_CREDENTIAL));
    };
  }

  _originPolicy(req, res, next) {
    if (!OriginPolicy.originAllowed(this._service.getBindMode(), req)) {
      return res.status(403).json({ error: 'Origin not allowed by sharing policy' });
    }
    return next();
  }

  _requireEnabled(req, res, next) {
    if (!this._service.isEnabled()) return res.status(503).json({ error: SharingAuth.DISABLED });
    return next();
  }

  _requireToken(req, res, next) {
    if (!this._service.isEnabled()) return res.status(503).json({ error: SharingAuth.DISABLED });
    return this._authenticate(req, SharingCredentialReader.bearer(req), next, () => res.status(401).json({ error: SharingAuth.BAD_CREDENTIAL }));
  }

  _authenticate(req, credential, next, reject) {
    const entry = credential ? this._service.verifyCredential(credential) : null;
    if (!entry) return reject();
    req.sharingToken = entry;
    return next();
  }
}

module.exports = SharingAuth;

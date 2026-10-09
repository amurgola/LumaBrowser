const express = require('express');
const https = require('https');
const SharingListener = require('./SharingListener');
const SharingRouter = require('./routes/SharingRouter');
const HostCertificate = require('../tls/HostCertificate');

class TlsSharingServer extends SharingListener {
  static BODY_LIMIT = '50mb';

  constructor({ hostService, getCredentials } = {}) {
    super();
    if (!hostService) throw new Error('TlsSharingServer requires a hostService');
    this._hostService = hostService;
    this._getCredentials = getCredentials || (() => HostCertificate.getOrCreate({ commonName: hostService.getInstanceName() }));
    this._fingerprint = null;
    this._pendingFingerprint = null;
  }

  getFingerprint() {
    return this._fingerprint;
  }

  _createServer() {
    const credentials = this._loadCredentials();
    this._pendingFingerprint = credentials.fingerprint256 || null;
    return https.createServer({ key: credentials.keyPem, cert: credentials.certPem }, this._buildApp());
  }

  _loadCredentials() {
    try {
      const credentials = this._getCredentials();
      if (!credentials || !credentials.keyPem || !credentials.certPem) throw new Error('no certificate material');
      return credentials;
    } catch (err) {
      throw new Error(`Could not load the sharing TLS certificate: ${(err && err.message) || err}`);
    }
  }

  _buildApp() {
    const app = express();
    app.disable('x-powered-by');
    app.use(express.json({ limit: TlsSharingServer.BODY_LIMIT }));
    app.use('/sharing', SharingRouter.create(this._hostService));
    return app;
  }

  _onListening() {
    this._fingerprint = this._pendingFingerprint;
    return { fingerprint256: this._fingerprint };
  }

  _onCleared() {
    this._fingerprint = null;
  }

  _logName() {
    return 'TLS server';
  }

  _fallbackError(port) {
    return `Could not start the sharing TLS listener on port ${port}.`;
  }
}

module.exports = TlsSharingServer;

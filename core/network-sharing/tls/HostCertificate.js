const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

class HostCertificate {
  static CERT_FILE = 'sharing-cert.pem';
  static KEY_FILE = 'sharing-key.pem';
  static DIR_NAME = 'sharing-tls';
  static VALID_DAYS = 3650;
  static RENEW_BEFORE_MS = 30 * 24 * 60 * 60 * 1000;
  static DEFAULT_COMMON_NAME = 'LumaBrowser Network Sharing';
  static MAX_COMMON_NAME_LENGTH = 63;

  static _cached = null;

  static getOrCreate({ dir, commonName } = {}) {
    const useDir = dir || HostCertificate._defaultDir();
    if (HostCertificate._cached && HostCertificate._cached.dir === useDir) return HostCertificate._cached;
    const identity = HostCertificate._loadExisting(useDir) || HostCertificate._generate(useDir, commonName);
    HostCertificate._cached = { dir: useDir, ...identity };
    return HostCertificate._cached;
  }

  static fingerprintOf(certPem) {
    return new crypto.X509Certificate(certPem).fingerprint256;
  }

  static resetCache() {
    HostCertificate._cached = null;
  }

  static _defaultDir() {
    try {
      const { app } = require('electron');
      return path.join(app.getPath('userData'), HostCertificate.DIR_NAME);
    } catch (_) {
      return path.join(os.tmpdir(), 'luma-sharing-tls');
    }
  }

  static _loadExisting(dir) {
    const certPath = path.join(dir, HostCertificate.CERT_FILE);
    const keyPath = path.join(dir, HostCertificate.KEY_FILE);
    if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) return null;
    try {
      return HostCertificate._validatedIdentity(fs.readFileSync(certPath, 'utf8'), fs.readFileSync(keyPath, 'utf8'));
    } catch (_) {
      return null;
    }
  }

  static _validatedIdentity(certPem, keyPem) {
    const x509 = new crypto.X509Certificate(certPem);
    if (new Date(x509.validTo).getTime() - Date.now() < HostCertificate.RENEW_BEFORE_MS) return null;
    if (!x509.checkPrivateKey(crypto.createPrivateKey(keyPem))) return null;
    return { keyPem, certPem, fingerprint256: x509.fingerprint256 };
  }

  static _generate(dir, commonName) {
    const selfsigned = require('selfsigned');
    const name = (commonName || HostCertificate.DEFAULT_COMMON_NAME).slice(0, HostCertificate.MAX_COMMON_NAME_LENGTH);
    const pems = selfsigned.generate(
      [{ name: 'commonName', value: name }],
      { days: HostCertificate.VALID_DAYS, keySize: 2048, algorithm: 'sha256' }
    );
    HostCertificate._persist(dir, pems);
    return { keyPem: pems.private, certPem: pems.cert, fingerprint256: HostCertificate.fingerprintOf(pems.cert) };
  }

  static _persist(dir, pems) {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, HostCertificate.KEY_FILE), pems.private, { mode: 0o600 });
    fs.writeFileSync(path.join(dir, HostCertificate.CERT_FILE), pems.cert, { mode: 0o644 });
  }
}

module.exports = HostCertificate;

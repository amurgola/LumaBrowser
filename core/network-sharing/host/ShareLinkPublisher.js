const LanAddress = require('./LanAddress');

class ShareLinkPublisher {
  constructor({ host, shares }) {
    this._host = host;
    this._shares = shares;
  }

  status() {
    const reason = this._unavailableReason();
    return { available: !reason, reason, baseUrl: reason ? null : this.baseUrl() };
  }

  create({ kind, targetId, title } = {}) {
    const current = this.status();
    if (!current.available) return { success: false, error: current.reason };
    try {
      const entry = this._shares.issueOrGet({ kind, targetId, title });
      return { success: true, url: `${current.baseUrl}/share/${entry.token}`, shareId: entry.id };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  resolve(token) {
    if (!this._host.isEnabled() || !this._host.isWebEnabled()) return null;
    return this._shares.resolve(token);
  }

  baseUrl() {
    const publicUrl = this._host.getWebPublicUrl();
    if (publicUrl) return publicUrl;
    const port = this._host.getWebPort();
    return `http://${LanAddress.pick()}${port === 80 ? '' : `:${port}`}`;
  }

  _unavailableReason() {
    if (!this._host.isEnabled()) return 'Enable Network Sharing in Settings to create share links.';
    if (!this._host.isWebEnabled()) return 'Turn on the web backend in Settings → Network Sharing to create share links.';
    if (!this._host.isWebRunning()) return 'The web backend isn’t running - check its port in Settings → Network Sharing.';
    return null;
  }
}

module.exports = ShareLinkPublisher;

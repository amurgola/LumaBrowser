class SharingNotices {
  constructor({ notifyModelStatus, notice, log = console }) {
    this._notifyLog = notifyModelStatus;
    this._notice = notice;
    this._log = log;
  }

  newClientNotifier() {
    return (info) => this.newClient(info);
  }

  newClient(info) {
    const who = (info && (info.peerHint || info.label)) || 'A device';
    const where = info && info.ip ? ` (${info.ip})` : '';
    const body = `${who}${where} just paired with Network Sharing.`;
    this._toLog(body, 'info');
    this._notice.show({ title: 'New device connected', body });
    return body;
  }

  async checkPublicUrl(hostService) {
    const result = await hostService.checkPublicUrlReachable();
    if (!result || result.skipped || result.ok) return null;
    const body = `Public URL check failed: ${result.error}`;
    this._log.warn('[sharing]', body);
    this._toLog(body, 'error');
    this._notice.show({ title: 'Public URL not reachable', body: result.error });
    return body;
  }

  _toLog(message, type) {
    try { this._notifyLog(message, type); } catch (_) {}
  }
}

module.exports = SharingNotices;

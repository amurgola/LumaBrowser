export default class PageApi {
  constructor(base = new URL('.', window.location.href)) {
    this._base = base;
  }

  devices() {
    return this._call('devices');
  }

  async ticket(deviceName) {
    return (await this._call('viewer-token', { device: deviceName })).token;
  }

  socketUrl(token) {
    const url = new URL('ws', this._base);
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    url.searchParams.set('token', token);
    return url.href;
  }

  async _call(path, body) {
    const response = await fetch(new URL(path, this._base), body === undefined ? {} : {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    const reply = await response.json().catch(() => null);
    if (!reply || reply.success === false) throw new Error((reply && reply.error) || `The app answered ${response.status}`);
    return reply.data;
  }
}

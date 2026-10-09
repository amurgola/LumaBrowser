export default class GameServerApi {
  static BASE = '/api/ext/game-mode';

  static playUrl(convId, bust) {
    if (!convId) return 'about:blank';
    const base = location.origin + GameServerApi.BASE + '/play/' + encodeURIComponent(convId) + '/index.html';
    return bust ? base + '?ts=' + Date.now() : base;
  }

  static async openTab(convId) {
    const r = await fetch(GameServerApi.BASE + '/open-tab/' + encodeURIComponent(convId), { method: 'POST' });
    if (!r.ok) throw new Error('open-tab ' + r.status);
  }

  static async exportZip(convId) {
    const r = await fetch(GameServerApi.BASE + '/export/' + encodeURIComponent(convId));
    if (!r.ok) throw new Error('export ' + r.status);
    const blob = await r.blob();
    const match = /filename="([^"]+)"/.exec(r.headers.get('content-disposition') || '');
    return { blob, filename: (match && match[1]) || 'game.zip' };
  }

  static publish(convId) {
    return GameServerApi._jsonCall('/publish/' + encodeURIComponent(convId), 'POST', 'publish');
  }

  static resetStores(convId) {
    return GameServerApi._jsonCall('/ai/' + encodeURIComponent(convId) + '/store', 'DELETE', 'reset');
  }

  static async _jsonCall(path, method, label) {
    const r = await fetch(GameServerApi.BASE + path, { method });
    const body = await r.json().catch(() => null);
    if (!r.ok || !body || !body.success) throw new Error((body && body.error) || (label + ' ' + r.status));
    return body;
  }
}

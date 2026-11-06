const PermissionKinds = require('../PermissionKinds');

class PopupGate {
  static KIND = 'popups';
  static ACTIVATION_MS = 5000;
  static MAX_BLOCKED = 20;
  static ACTIVATING = new Set([
    'mouseDown', 'mouseUp', 'rawKeyDown', 'keyDown', 'char', 'touchStart', 'touchEnd',
    'gestureTap', 'pointerDown', 'pointerUp',
  ]);

  constructor({ sites, channel, now = () => Date.now() }) {
    this._sites = sites;
    this._channel = channel;
    this._now = now;
  }

  wire(entry) {
    const wc = entry.webContents;
    wc.on('input-event', (_event, input) => this.noteInput(entry, input));
    wc.on('did-navigate', () => this.clear(entry));
  }

  noteInput(entry, input) {
    if (input && PopupGate.ACTIVATING.has(input.type)) entry.lastUserInputAt = this._now();
  }

  allows(entry) {
    if (!entry.isRegularBrowsing()) return true;
    if (this._now() - (entry.lastUserInputAt || 0) <= PopupGate.ACTIVATION_MS) return true;
    return this.siteAllowed(entry.url);
  }

  siteAllowed(url) {
    const origin = PermissionKinds.originOf(url);
    return !!origin && !!this._sites && this._sites.answerFor(origin, PopupGate.KIND) === 'allow';
  }

  block(entry, url) {
    const list = entry.blockedPopups || (entry.blockedPopups = []);
    list.push({ url: url || '' });
    if (list.length > PopupGate.MAX_BLOCKED) list.shift();
    this._channel.broadcast(entry);
  }

  clear(entry) {
    if (!entry.blockedPopups || !entry.blockedPopups.length) return;
    entry.blockedPopups = [];
    this._channel.broadcast(entry);
  }

  take(entry, index) {
    const list = entry.blockedPopups || [];
    if (!Number.isInteger(index) || index < 0 || index >= list.length) return null;
    const [item] = list.splice(index, 1);
    this._channel.broadcast(entry);
    return item.url || null;
  }

  allowSite(entry) {
    const origin = PermissionKinds.originOf(entry.url);
    if (!origin || !this._sites) return { success: false, urls: [] };
    this._sites.remember(origin, [PopupGate.KIND], 'allow');
    const urls = (entry.blockedPopups || []).map((b) => b.url).filter(Boolean);
    entry.blockedPopups = [];
    this._channel.broadcast(entry);
    return { success: true, urls };
  }
}

module.exports = PopupGate;

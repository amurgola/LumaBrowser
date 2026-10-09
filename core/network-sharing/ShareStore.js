const crypto = require('crypto');
const RevocableEntryStore = require('./RevocableEntryStore');

class ShareStore extends RevocableEntryStore {
  static STORAGE_KEY = 'core.sharing.shareLinks';
  static TOKEN_PATTERN = /^[a-f0-9]{32}$/;
  static KINDS = new Set(['conversation', 'artifact']);
  static TITLE_MAX_LENGTH = 200;
  static TOKEN_PREVIEW_CHARS = 8;

  constructor(db) {
    super(db, ShareStore.STORAGE_KEY);
  }

  static generateToken() {
    return crypto.randomBytes(16).toString('hex');
  }

  list() {
    return this._read().map((share) => ShareStore._publicView(share));
  }

  issueOrGet({ kind, targetId, title } = {}) {
    const validKind = ShareStore._requireKind(kind);
    const target = ShareStore._requireTarget(targetId);
    const list = this._read();
    const existing = list.find((share) => share.kind === validKind && share.targetId === target && !share.revoked);
    if (existing) return this._refreshTitle(list, existing, title);
    return this._issue(list, validKind, target, title);
  }

  resolve(token) {
    if (!ShareStore._isWellFormedToken(token)) return null;
    return this._findLive((share) => share.token === token);
  }

  removeForTarget(kind, targetId) {
    return this._removeWhere((share) => share.kind === kind && share.targetId === targetId);
  }

  static _publicView(share) {
    return {
      id: share.id,
      kind: share.kind,
      targetId: share.targetId,
      title: share.title || null,
      createdAt: share.createdAt,
      revoked: !!share.revoked,
      tokenPreview: RevocableEntryStore._maskToken(share.token, ShareStore.TOKEN_PREVIEW_CHARS),
    };
  }

  static _requireKind(kind) {
    const validKind = String(kind || '');
    if (!ShareStore.KINDS.has(validKind)) throw new Error(`Unknown share kind "${kind}"`);
    return validKind;
  }

  static _requireTarget(targetId) {
    const target = String(targetId || '').trim();
    if (!target) throw new Error('A share link needs a targetId');
    return target;
  }

  static _isWellFormedToken(token) {
    return typeof token === 'string' && ShareStore.TOKEN_PATTERN.test(token);
  }

  static _cleanTitle(title) {
    return title ? String(title).slice(0, ShareStore.TITLE_MAX_LENGTH) : null;
  }

  _refreshTitle(list, existing, title) {
    if (!title || existing.title === title) return existing;
    existing.title = ShareStore._cleanTitle(title);
    this._write(list);
    return existing;
  }

  _issue(list, kind, targetId, title) {
    const entry = {
      id: crypto.randomUUID(),
      kind,
      targetId,
      title: ShareStore._cleanTitle(title),
      token: ShareStore.generateToken(),
      createdAt: new Date().toISOString(),
      revoked: false,
    };
    this._write([...list, entry]);
    return entry;
  }
}

module.exports = ShareStore;

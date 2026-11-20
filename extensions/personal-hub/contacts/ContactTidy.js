const ContactProfile = require('./ContactProfile');
const ContactService = require('./ContactService');

class ContactTidy {
  constructor({ contacts, repository }) {
    this._contacts = contacts;
    this._repository = repository;
  }

  run(changed = [], { contextOf = () => null } = {}) {
    const fates = ContactTidy._fates(changed);
    const refit = this._refit(fates);
    const seen = this._remember(changed, fates, contextOf);
    const merged = this._joinSameApp();
    this._dropEmpty();
    return { ...refit, seen, merged };
  }

  static _fates(changed) {
    const names = new Map();
    for (const row of changed) {
      const was = ContactService.parse(row.was, row.app);
      if (!was) continue;
      const key = ContactTidy._key(row.app, was.handle);
      if (!names.has(key)) names.set(key, new Set());
      names.get(key).add(row.sender || '');
    }
    const fates = new Map();
    for (const [key, set] of names) fates.set(key, set.size === 1 ? [...set][0] : '');
    return fates;
  }

  _refit(fates) {
    const result = { renamed: 0, dropped: 0 };
    for (const listed of this._repository.listIdentities()) {
      const identity = this._repository.getIdentity(listed.id);
      const key = identity ? ContactTidy._key(identity.app, identity.handle) : '';
      if (!fates.has(key)) continue;
      const who = ContactService.parse(fates.get(key), identity.app);
      if (!who) {
        this._repository.deleteIdentity(identity.id);
        result.dropped += 1;
        continue;
      }
      this._rename(identity, who);
      result.renamed += 1;
    }
    return result;
  }

  _rename(identity, who) {
    const target = this._repository.findIdentity(identity.app, who.handle, identity.contextId);
    const kept = target && target.id !== identity.id ? target : identity;
    if (kept === target) {
      if (target.contactId !== identity.contactId) this._join([target.contactId, identity.contactId]);
      this._repository.foldIdentity(identity.id, target.id);
    } else {
      this._repository.renameIdentity(identity.id, who.handle, who.display);
    }
    const owner = this._repository.getContact((this._repository.getIdentity(kept.id) || {}).contactId);
    if (owner && owner.name === identity.display) this._repository.renameContact(owner.id, who.display);
  }

  _remember(changed, fates, contextOf) {
    let seen = 0;
    for (const row of changed) {
      const was = ContactService.parse(row.was, row.app);
      if (was && fates.get(ContactTidy._key(row.app, was.handle))) continue;
      if (this._contacts.observe({ app: row.app, sender: row.sender, contextId: contextOf(row), at: row.receivedAt })) seen += 1;
    }
    return seen;
  }

  _joinSameApp() {
    const byKey = new Map();
    for (const identity of this._repository.listIdentities()) {
      const key = ContactTidy._key(identity.app, identity.handle);
      if (!byKey.has(key)) byKey.set(key, new Set());
      byKey.get(key).add(identity.contactId);
    }
    let merged = 0;
    for (const ids of byKey.values()) {
      const live = [...ids].filter((id) => this._repository.getContact(id));
      if (live.length > 1) merged += this._join(live);
    }
    return merged;
  }

  _join(ids) {
    const contacts = [...new Set(ids)].map((id) => this._contacts.get(id)).filter(Boolean);
    if (contacts.length < 2) return 0;
    const described = (c) => (ContactProfile.isEmpty(c.profile) && !c.contextId ? 0 : 1);
    const [keeper, ...others] = contacts.sort((a, b) => described(b) - described(a) || b.count - a.count);
    for (const other of others) this._contacts.merge(keeper.id, other.id);
    return others.length;
  }

  _dropEmpty() {
    const used = new Set(this._repository.listIdentities().map((i) => i.contactId));
    for (const contact of this._repository.listContacts()) {
      if (!used.has(contact.id) && ContactProfile.isEmpty(contact.profile) && !contact.contextId) this._repository.deleteContact(contact.id);
    }
  }

  static _key(app, handle) {
    return `${String(app || '')}\n${handle}`;
  }
}

module.exports = ContactTidy;

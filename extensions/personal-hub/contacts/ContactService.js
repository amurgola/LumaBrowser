const RecordId = require('../../../core/database/RecordId');

class ContactService {
  static CONTACT_PREFIX = 'con';
  static IDENTITY_PREFIX = 'cid';
  static NOT_SAME_KEY = 'contacts.notSame';
  static MAX_NAME = 60;
  static EMAIL = /([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})/i;
  static NOT_PEOPLE = /^(no-?reply|notifications?|mailer-daemon|do-?not-?reply|support|team|admin|system|bot)\b|\bbot$|\bvia\b/i;

  constructor({ contacts, db, emit = () => {} }) {
    this._contacts = contacts;
    this._db = db;
    this._emit = emit;
  }


  observe({ app, sender, contextId = null, at = new Date().toISOString() } = {}) {
    const who = ContactService.parse(sender, app);
    if (!who) return null;
    const known = this._contacts.findIdentity(String(app || ''), who.handle, contextId);
    if (known) {
      this._contacts.touchIdentity(known.id, at);
      return this._contacts.getContact(known.contactId);
    }
    const match = this._match(who, contextId);
    const contact = match || this._contacts.insertContact({ id: RecordId.create(ContactService.CONTACT_PREFIX), name: who.display });
    this._contacts.insertIdentity({
      id: RecordId.create(ContactService.IDENTITY_PREFIX), contactId: contact.id, app: String(app || ''), handle: who.handle,
      display: who.display, contextId, at,
    });
    this._emit('contact.changed', { contactId: contact.id, reason: match ? 'identity' : 'new' });
    return contact;
  }

  lookup({ app, sender, contextId = null } = {}) {
    const who = ContactService.parse(sender, app);
    if (!who) return null;
    const exact = this._contacts.findIdentity(String(app || ''), who.handle, contextId);
    const any = exact || this._contacts.identitiesByHandle(who.handle).find((i) => who.isEmail || i.contextId === (contextId || null));
    return any ? this._describe(this._contacts.getContact(any.contactId)) : null;
  }

  backfill(rows) {
    let seen = 0;
    for (const row of rows || []) {
      if (this.observe(row)) seen += 1;
    }
    return seen;
  }

  isEmpty() {
    return this._contacts.countContacts() === 0;
  }


  list({ query = '', limit = 200 } = {}) {
    const wanted = String(query || '').trim().toLowerCase();
    const byContact = this._identitiesByContact();
    const contacts = this._contacts.listContacts()
      .map((contact) => ContactService._withIdentities(contact, byContact.get(contact.id) || []))
      .filter((c) => c.identities.length)
      .filter((c) => !wanted || c.name.toLowerCase().includes(wanted) || c.identities.some((i) => i.handle.includes(wanted) || i.app.includes(wanted)));
    return contacts.sort((a, b) => String(b.lastAt || '').localeCompare(String(a.lastAt || ''))).slice(0, limit);
  }

  get(id) {
    const contact = this._contacts.getContact(id);
    return contact ? this._describe(contact) : null;
  }

  suggestions({ limit = 20 } = {}) {
    const rejected = new Set(this._db.get(ContactService.NOT_SAME_KEY, []) || []);
    const byName = new Map();
    for (const contact of this.list({ limit: 5000 })) {
      const key = ContactService._nameKey(contact.name);
      if (!key || !key.includes(' ')) continue;
      if (!byName.has(key)) byName.set(key, []);
      byName.get(key).push(contact);
    }
    const pairs = [];
    for (const group of byName.values()) {
      for (let i = 0; i < group.length; i++) {
        for (let j = i + 1; j < group.length; j++) {
          if (!rejected.has(ContactService._pairKey(group[i].id, group[j].id))) pairs.push({ a: group[i], b: group[j], reason: 'Same name in different contexts' });
        }
      }
    }
    return pairs.slice(0, limit);
  }


  merge(intoId, fromId) {
    if (!intoId || !fromId || intoId === fromId) throw new Error('Name two different contacts to merge.');
    const into = this._contacts.getContact(intoId);
    const from = this._contacts.getContact(fromId);
    if (!into || !from) throw new Error('Contact not found.');
    this._contacts.moveIdentities(from.id, into.id);
    this._contacts.deleteContact(from.id);
    this._emit('contact.changed', { contactId: into.id, reason: 'merged' });
    return this._describe(into);
  }

  split(identityId) {
    const identity = this._contacts.getIdentity(identityId);
    if (!identity) throw new Error('Identity not found.');
    if (this._contacts.identitiesOf(identity.contactId).length < 2) throw new Error('This is the only way this contact appears; there is nothing to split.');
    const contact = this._contacts.insertContact({ id: RecordId.create(ContactService.CONTACT_PREFIX), name: identity.display || identity.handle });
    this._contacts.moveIdentity(identity.id, contact.id);
    this._reject(identity.contactId, contact.id);
    this._emit('contact.changed', { contactId: contact.id, reason: 'split' });
    return this._describe(contact);
  }

  rename(id, name) {
    const clean = String(name || '').trim();
    if (!clean) throw new Error('A contact needs a name.');
    if (!this._contacts.getContact(id)) throw new Error('Contact not found.');
    const contact = this._contacts.renameContact(id, clean.slice(0, ContactService.MAX_NAME));
    this._emit('contact.changed', { contactId: id, reason: 'renamed' });
    return this._describe(contact);
  }

  notSame(aId, bId) {
    this._reject(aId, bId);
    this._emit('contact.changed', { reason: 'not-same' });
    return true;
  }


  static parse(sender, app = '') {
    const raw = String(sender || '').replace(/\s+/g, ' ').trim();
    if (!raw || raw.length > ContactService.MAX_NAME * 2) return null;
    const email = raw.match(ContactService.EMAIL);
    const display = (email ? raw.replace(/<?[^\s<]+@[^\s>]+>?/, '') : raw).replace(/^["'\s]+|["'\s]+$/g, '').trim();
    if (email) {
      const address = email[1].toLowerCase();
      if (ContactService.NOT_PEOPLE.test(address.split('@')[0])) return null;
      return { handle: address, display: display || address, isEmail: true };
    }
    if (display.length > ContactService.MAX_NAME || /^[#@]/.test(display) || !/\p{L}/u.test(display)) return null;
    if (display.toLowerCase() === String(app || '').toLowerCase() || ContactService.NOT_PEOPLE.test(display)) return null;
    return { handle: ContactService._nameKey(display), display, isEmail: false };
  }

  _match(who, contextId) {
    const same = this._contacts.identitiesByHandle(who.handle);
    const found = who.isEmail
      ? same[0]
      : (who.handle.includes(' ') ? same.find((i) => i.contextId === (contextId || null)) : null);
    return found ? this._contacts.getContact(found.contactId) : null;
  }

  _describe(contact) {
    return contact ? ContactService._withIdentities(contact, this._contacts.identitiesOf(contact.id)) : null;
  }

  _identitiesByContact() {
    const byContact = new Map();
    for (const identity of this._contacts.listIdentities()) {
      if (!byContact.has(identity.contactId)) byContact.set(identity.contactId, []);
      byContact.get(identity.contactId).push(identity);
    }
    return byContact;
  }

  _reject(aId, bId) {
    const rejected = new Set(this._db.get(ContactService.NOT_SAME_KEY, []) || []);
    rejected.add(ContactService._pairKey(aId, bId));
    this._db.set(ContactService.NOT_SAME_KEY, [...rejected]);
  }

  static _withIdentities(contact, identities) {
    return {
      id: contact.id,
      name: contact.name,
      identities,
      lastAt: identities.reduce((latest, i) => (String(i.lastAt || '') > latest ? i.lastAt : latest), ''),
      count: identities.reduce((n, i) => n + (i.count || 0), 0),
    };
  }

  static _nameKey(name) {
    return String(name || '').toLowerCase().replace(/[^\p{L}\p{N}@.' -]+/gu, ' ').replace(/\s+/g, ' ').trim();
  }

  static _pairKey(aId, bId) {
    return [String(aId), String(bId)].sort().join('|');
  }
}

module.exports = ContactService;

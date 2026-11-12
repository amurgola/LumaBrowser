class ContactRepository {
  constructor(db) {
    this._db = db;
  }

  getContact(id) {
    const row = this._db.query('SELECT * FROM hub_contacts WHERE id = ?', id)[0];
    return row ? ContactRepository.hydrateContact(row) : null;
  }

  insertContact({ id, name }) {
    const now = new Date().toISOString();
    this._db.run('INSERT INTO hub_contacts (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)', id, name, now, now);
    return this.getContact(id);
  }

  renameContact(id, name) {
    this._db.run('UPDATE hub_contacts SET name = ?, updated_at = ? WHERE id = ?', name, new Date().toISOString(), id);
    return this.getContact(id);
  }

  deleteContact(id) {
    return this._db.run('DELETE FROM hub_contacts WHERE id = ?', id).changes > 0;
  }

  listContacts() {
    return this._db.query('SELECT * FROM hub_contacts ORDER BY name ASC').map(ContactRepository.hydrateContact);
  }

  countContacts() {
    const row = this._db.query('SELECT COUNT(*) AS n FROM hub_contacts')[0];
    return (row && row.n) || 0;
  }

  getIdentity(id) {
    const row = this._db.query('SELECT * FROM hub_contact_identities WHERE id = ?', id)[0];
    return row ? ContactRepository.hydrateIdentity(row) : null;
  }

  findIdentity(app, handle, contextId) {
    const row = this._db.query('SELECT * FROM hub_contact_identities WHERE app = ? AND handle = ? AND context_id = ?', app, handle, contextId || '')[0];
    return row ? ContactRepository.hydrateIdentity(row) : null;
  }

  identitiesByHandle(handle) {
    return this._db.query('SELECT * FROM hub_contact_identities WHERE handle = ?', handle).map(ContactRepository.hydrateIdentity);
  }

  identitiesOf(contactId) {
    return this._db.query('SELECT * FROM hub_contact_identities WHERE contact_id = ? ORDER BY last_at DESC', contactId).map(ContactRepository.hydrateIdentity);
  }

  listIdentities() {
    return this._db.query('SELECT * FROM hub_contact_identities ORDER BY last_at DESC').map(ContactRepository.hydrateIdentity);
  }

  insertIdentity(row) {
    this._db.run(
      'INSERT INTO hub_contact_identities (id, contact_id, app, handle, display, context_id, first_at, last_at, count) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)',
      row.id, row.contactId, row.app, row.handle, row.display || '', row.contextId || '', row.at, row.at,
    );
    return this.getIdentity(row.id);
  }

  touchIdentity(id, at) {
    this._db.run('UPDATE hub_contact_identities SET last_at = ?, count = count + 1 WHERE id = ?', at, id);
  }

  moveIdentity(id, contactId) {
    this._db.run('UPDATE hub_contact_identities SET contact_id = ? WHERE id = ?', contactId, id);
  }

  moveIdentities(fromContactId, toContactId) {
    return this._db.run('UPDATE hub_contact_identities SET contact_id = ? WHERE contact_id = ?', toContactId, fromContactId).changes;
  }

  static hydrateContact(row) {
    return { id: row.id, name: row.name, createdAt: row.created_at, updatedAt: row.updated_at };
  }

  static hydrateIdentity(row) {
    return {
      id: row.id, contactId: row.contact_id, app: row.app, handle: row.handle, display: row.display || '',
      contextId: row.context_id || null, firstAt: row.first_at, lastAt: row.last_at, count: row.count,
    };
  }
}

module.exports = ContactRepository;

# ContactRepository

`extensions/personal-hub/contacts/ContactRepository.js`

Plain queries over `hub_contacts` and `hub_contact_identities`: the people
the Hub has seen, and the names or addresses each one goes by in each app
and context. One contact has many identities; an identity is unique per
`(app, handle, context)`. The rules that join identities into people live in
[ContactService](ContactService.md).

## Methods

- `new ContactRepository(db)`: `db` is the extension's DatabaseService.
- Contacts: `getContact(id)` -> the row or `null`, `insertContact({ id,
  name })` (stamps both times and returns the row), `renameContact(id,
  name)` -> the row, `deleteContact(id)` -> whether a row went,
  `listContacts()` by name, `countContacts()`.
- Identities: `getIdentity(id)`, `findIdentity(app, handle, contextId)` (the
  one identity of that key; a missing context is the empty string),
  `identitiesByHandle(handle)` (every identity with this handle, whatever
  the app or context), `identitiesOf(contactId)` and `listIdentities()`
  (both most recently seen first).
- `insertIdentity({ id, contactId, app, handle, display, contextId, at })`:
  `at` is both the first and the last time seen, the count starts at 1.
  Returns the row.
- `touchIdentity(id, at)`: seen again, so `last_at` moves and the count
  grows by one.
- `moveIdentity(id, contactId)`: one identity to another contact.
  `moveIdentities(fromContactId, toContactId)` -> how many moved.
- `static hydrateContact(row)`, `static hydrateIdentity(row)`.

Contacts hydrate to `{ id, name, createdAt, updatedAt }`, identities to
`{ id, contactId, app, handle, display, contextId, firstAt, lastAt, count }`.
`contextId` is stored as an empty string when the sender belongs to no
context and reads back as `null`.

## Why

An identity keeps its context because the same name in two companies may be
two people: the key `(app, handle, context)` lets each sighting stand on its
own until the service, or the user, says whose it is.

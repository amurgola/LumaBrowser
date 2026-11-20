# ContactService

`extensions/personal-hub/contacts/ContactService.js`

The Hub's memory of people. Every sender the activity feed sees becomes an
identity (how someone appears in one app, in one context), and identities
are gathered into contacts (one person). The Hub joins what is safe to join
on its own and only suggests the rest; the user merges, splits, renames and
keeps apart in Settings > Hub > People
([PeopleSection](../ui/settings/PeopleSection.md)). Summaries use it to name
a participant as the person the user knows
([ActivitySummarizer](../summary/ActivitySummarizer.md)). Each contact also
carries what is known about it ([ContactProfile](ContactProfile.md)): a
person or a general contact, its fields, further details and notes, written
by the user or a tool, plus what a model proposed and the user has not
decided on ([ContactProfiler](ContactProfiler.md)), and the context it
belongs to (the company a person works for), which files what they send the
user directly ([ContextService](../context/ContextService.md)). Emits
`contact.changed` after a change the user or a new person made.

## Joining

- The same address anywhere is the same person, whatever the app or context.
- The same name on the same app is the same person, whichever context each
  conversation is filed under: Dana Reyes in two channels of one Slack. This
  holds for a single-word name too.
- The same full name (two words or more) inside one context is the same
  person across apps: Dana Reyes in Acme's Gmail and in Acme's Slack.
- The same full name on different apps in different contexts is only
  suggested (`suggestions`), and a single-word name never joins across apps
  by itself.
- A sender that does not read as a person is not remembered (`parse`).

`_sameIdentity(who, app, contextId)` is those rules for a sender not seen
in this app and context before: the first identity with the same address,
else one with the same handle on the same app, else (for a full name) one
with the same handle in the same context.

## Methods

- `new ContactService({ contacts, db, emit?, now? })`: `contacts` a
  [ContactRepository](ContactRepository.md), `db` the extension's
  DatabaseService (the kept-apart pairs), `emit(type, payload)` the renderer
  push, `now()` a Date that ages and coming birthdays are worded against
  (default the clock).
- `observe({ app, sender, contextId?, at? })` -> the contact, or `null` when
  the sender does not read as a person. A known identity (same app, handle
  and context) is touched: its last time moves and its count grows. A new
  one joins the contact the rules above find, else a new contact named as
  the sender appeared, and `contact.changed` is emitted.
- `lookup({ app, sender, contextId? })` -> the contact a sender is already
  known as, with its identities, or `null`. Never creates anything. The
  identity of that app, handle and context first, else whatever the joining
  rules find (`_sameIdentity`).
- `find({ app, sender })` -> the one contact a sender can be before its
  context is known (the contact is what may decide the context), or `null`.
  Never creates anything. An identity with the same handle on the same app
  wins; otherwise an address matches anywhere, and a full name only when a
  single contact goes by it. A single-word name seen only on another app,
  or a full name two contacts share, answers `null`.
- `backfill(rows)` -> how many rows were people: `observe` over `[{ app,
  sender, contextId, at }]`, oldest first, to seed the memory from the
  notification log already kept.
- `isEmpty()`: whether there is no contact yet.
- `list({ query = '', limit = 200 })` -> `[{ id, name, kind, contextId,
  profile: { fields, details, notes, suggested }, role, about, identities:
  [{ id, app, handle, display, contextId, lastAt, count }], lastAt, count
  }]`, most recently seen first; `lastAt` and `count` are the newest
  sighting and the total over the identities. The contact's own `contextId`
  is the context it belongs to, or `null`. `role` is `ContactProfile.role` (a person's
  relation, what a general contact is) and `about` is
  `ContactProfile.about`, the one line the assistant reads. The profile's
  `dismissed` list is not handed out. `query` narrows by part of the name,
  of `about`, a handle or an app. A contact left with no identity is not
  listed. Every method below that returns a contact returns this shape.
- `kinds()` -> `ContactProfile.KINDS`, the form each kind of contact has:
  `[{ kind, label, fields: [{ key, label, type, hint?, options? }] }]`.
- `get(id)` -> one contact with its identities, or `null`.
- `suggestions({ limit = 20 })` -> `[{ a, b, reason }]`: pairs of contacts
  with the same full name, `reason` `Same name in different contexts`. Pairs
  the user said are different people are left out.
- `merge(intoId, fromId)` -> the merged contact: everything `fromId` goes by
  now belongs to `intoId`, which keeps its name, and `fromId` is gone. The
  two profiles are joined (`ContactProfile.merge`: what `intoId` says
  stays, `fromId` fills the blanks), and `intoId` takes `fromId`'s context
  when it has none of its own. Throws `Name two different contacts to
  merge.` and `Contact not found.`.
- `split(identityId)` -> the new contact: one identity becomes a person of
  its own, named as that identity appears, and the pair is recorded as kept
  apart so it is not suggested straight back. Throws `Identity not found.`
  and `This is the only way this contact appears; there is nothing to
  split.`.
- `rename(id, name)` -> the contact; the name is trimmed and cut to
  `MAX_NAME` = 60. Throws `A contact needs a name.` and `Contact not
  found.`.
- `notSame(aId, bId)` -> `true`: the user said these two are different
  people, so the pair is not suggested again.
- `saveProfile(id, patch = {})` -> the contact: changes what is kept about
  it. `patch` is `{ kind?, fields?, details?, addDetails?, notes?, addNote?
  }` as `ContactProfile.apply` reads them, plus `contextId?`: the context
  the contact belongs to, trimmed, `''` for none (the id is stored as
  given; [HubService](../HubService.md)`.saveContactProfile` is what checks
  that the context exists). Only what is given changes, and a missing or
  empty `kind` keeps the current one. Throws `Contact not found.` and
  whatever `ContactProfile.cleanKind` and `apply` throw.
- `propose(id, proposals)` -> the contact: what a model read out of the
  conversations (`[{ key, value, why }]`) kept as suggestions through
  `ContactProfile.propose`; nothing is written into the profile itself.
  Throws `Contact not found.`.
- `resolveSuggestion(id, suggestionId, accept)` -> the contact: accepted,
  the suggestion is written into the profile (`ContactProfile.accept`,
  which may change the kind); otherwise it is dropped and remembered so it
  is not proposed again (`ContactProfile.dismiss`). Throws `Contact not
  found.` and `That suggestion is no longer there.`.
- `static parse(sender, app = '')` -> `{ handle, display, isEmail }` or
  `null`. A sender carrying an address has the lower-cased address as its
  handle and the rest of the text as its display name (the address itself
  when there is none). Otherwise the handle is the name in lower case with
  punctuation and extra spaces removed. `null` for an empty sender, one
  longer than 120 characters, a name longer than 60, one starting with `#`
  or `@` (a channel), one with no letter, the app's own name, and anything
  `NOT_PEOPLE` matches (no-reply, notifications, mailer-daemon, support,
  team, admin, system, a bot, `via`).

## Storage

Ids are made by RecordId with the prefixes `con` (contact), `cid`
(identity) and `sug` (a suggestion on a contact's profile). The kind, the
profile and the context are stored on the contact's row (`saveProfile` and
`setContext` of the repository). The pairs the user keeps apart are the setting
`contacts.notSame`, a list of `<id>|<id>` keys with the two ids sorted.

## Events

`contact.changed` with `{ contactId, reason }`, reason `new` (a first
sighting made a contact), `identity` (a new way an existing contact
appears), `merged`, `split`, `renamed`, `profile` (`saveProfile`, or a
suggestion accepted) or `suggested` (`propose`, or a suggestion dismissed),
and `{ reason: 'not-same' }`. A repeat sighting of a known identity emits
nothing.

## Why

The user works across many companies, and the same person reaches them as a
Slack name in one place and a mail sender in another. An address is as good
as an identity gets, so it joins everywhere. A name on one app is the same
person wherever the conversation is filed: one channel of a company's Slack
can belong to another context, and when contexts are set up or changed the
person must not become a second, blank contact that has lost what the user
recorded. Across apps a full name is trusted only inside one context,
because two people may share a name, so across contexts the Hub asks
instead of deciding. A single word (a first name, a nickname) is too weak
to join across apps at all.

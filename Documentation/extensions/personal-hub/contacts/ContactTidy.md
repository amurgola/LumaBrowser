# ContactTidy

`extensions/personal-hub/contacts/ContactTidy.js`

Puts the people memory right after the rules that read a sender out of a
notification changed ([NotificationClassifier](../inbox/NotificationClassifier.md)).
Identities made from a misread sender (`New message from Dana Reyes`, `New
email received`) take the name they really have or are dropped, the senders
the old rules never saw are remembered, and contacts that turn out to be one
person (the same name on the same app) are joined, keeping what the user
recorded about either. It works on what
[InboxService](../inbox/InboxService.md)`.reclassify` reports.

## Methods

- `new ContactTidy({ contacts, repository })`: `contacts` a
  [ContactService](ContactService.md), `repository` the
  [ContactRepository](ContactRepository.md) under it.
- `run(changed = [], { contextOf = () => null })` -> `{ renamed, dropped,
  seen, merged }`. `changed` is the notifications a reclassify pass gave a
  new sender (`{ app, was, sender, receivedAt, ... }`, `was` the old
  sender), oldest first; `contextOf(notification)` names the context a
  newly seen sender is remembered in. The steps below run in this order.

## Steps

- `static _fates(changed)`: what became of each misread sender, keyed by
  app and the handle `ContactService.parse` gives the old sender (an old
  sender that does not read as a person is skipped). The value is the one
  name it always stood for, or `''` when it stood for nobody or for several
  people (a channel title, `New email received`).
- `_refit(fates)` -> `{ renamed, dropped }`: every identity whose app and
  handle have a fate is read again (an earlier join may have moved it) and
  then either dropped (`deleteIdentity`, when the fate does not read as a
  person) or renamed (`_rename`).
- `_rename(identity, who)`: when the person already has an identity with
  the right handle in the same app and context, the two contacts are joined
  (`_join`) and the misread identity is folded into it (`foldIdentity`, so
  its sightings are kept). Otherwise the row is renamed in place
  (`renameIdentity`). A contact that is still called by the misread sender
  is renamed with it.
- `_remember(changed, fates, contextOf)` -> how many were seen: the
  notifications whose old sender stood for nobody in particular (no fate, or
  an empty one) were never remembered under their real sender, so each is
  now passed to `ContactService.observe` with its new sender, the context
  `contextOf` names and its time. Those whose old sender was renamed are
  skipped: the renamed identity already carries their sightings.
- `_joinSameApp()` -> how many contacts were folded in: contacts that share
  an identity's app and handle become one, with or without anything
  misread.
- `_join(ids)`: joins contacts through `ContactService.merge` into the one
  the user described (a profile that is not empty, or a context), else the
  one seen most.
- `_dropEmpty()`: a contact left with no identity, an empty profile and no
  context is deleted. One the user described stays, though
  `ContactService.list` does not show a contact without identities.

## Wiring

[PersonalHubExtension](../PersonalHubExtension.md)`._refit` runs it once
after `FEED_RULES` was raised, with the reclassify pass's `changed` and a
`contextOf` that resolves the notification's url, partition, host, sender
and app through [ContextService](../context/ContextService.md)`.resolve`.

## Why

A rule that misreads a sender does more than mislabel a row: it makes a
contact, and the user may have recorded who that contact is before the rule
was fixed. Dropping and rebuilding the memory would lose that, so the tidy
moves identities to where they belong and merges contacts, and
`ContactProfile.merge` keeps what either side said.

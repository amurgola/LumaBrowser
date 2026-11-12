# PeopleSection

`extensions/personal-hub/ui/settings/PeopleSection.js`

The Hub's people section: who the Hub has seen in the activity
feed, each with every way they appear (app and context). The Hub joins the
same address anywhere and the same full name inside one context on its own
([ContactService](../../contacts/ContactService.md)); here the user settles
the rest: confirm or reject a suggested match across contexts, merge the
ticked contacts into one, split off an identity that was joined to the wrong
person, and correct a name. Shown in Settings > Hub and in the Dashboard's
settings panel ([HubSettingsPanel](../widgets/HubSettingsPanel.md)), so it
imports only from the extension's own ui folder (`WidgetDom.esc` for
escaping; see [HubSection](HubSection.md)).

## Behaviour

- The help text states the rules: the same address, or the same full name
  within one context, is one person; the same name in two contexts is only
  suggested, because people share names and work with several companies;
  summaries use this to know that a Slack name and a mail sender are the
  same person.
- Suggestions sit above the list, one row per pair: `Same person?` with
  both names and where each appears, then `Same person`
  (`mergeContacts(a.id, b.id)`, so the first keeps its name) and `Different
  people` (`keepContactsApart(a.id, b.id)`, and the pair is not suggested
  again).
- The search box (`Find a person, address or app`) reloads the list
  `SEARCH_DEBOUNCE_MS` = 250 ms after typing stops. At most `SHOWN` = 60
  people are listed, most recently seen first.
- One block per person (`.ext-hub-person`, `data-contact`): a tick box, the
  name in an editable field, and the notification count. Changing the name
  saves it at once (`renameContact`).
- Under it, one badge per identity (`data-identity`, the handle as tooltip):
  `<app>, <context name>: <display name or handle>`, the context left out
  when the identity has none. A person with two or more identities has a
  `Split` button on each (`splitContactIdentity`): this is someone else, so
  it becomes a person of its own.
- `Merge ticked` folds every ticked person into the first ticked one, one
  `mergeContacts` call each, so the first keeps its name. With fewer than
  two ticked it only says `Tick two or more people to merge.`.
- Every action reports on the tab's notice line (`Name saved.`, `Split into
  a person of its own.`, `Merged.`, `Kept apart.`, or the error) and reloads
  the section.
- Empty state: `Nobody yet. People appear here as notifications arrive.`,
  or `Nobody matches.` while a search is typed.

## Methods

- `new PeopleSection(tab)` (see [HubSection](HubSection.md)).
- `load()`: reads the people for the current search and the contexts (for
  their names; a failed read of the contexts leaves the badges without
  one).
- `unbind()` also clears the pending search timer.

## IPC

`listContacts({ query, limit })`, `listContexts`, `mergeContacts(intoId,
fromId)`, `splitContactIdentity(identityId)`, `renameContact(id, name)`,
`keepContactsApart(aId, bId)`.

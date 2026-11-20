# PeopleSection

`extensions/personal-hub/ui/settings/PeopleSection.js`

The Hub's people section: who the Hub has seen in the activity
feed, each with every way they appear (app and context) and what is known
about them. The Hub joins the
same address anywhere, the same name on one app and the same full name
inside one context on its own
([ContactService](../../contacts/ContactService.md)); here the user settles
the rest: confirm or reject a suggested match across contexts, merge the
ticked contacts into one, split off an identity that was joined to the wrong
person, and correct a name. About opens what the assistant knows about a
contact ([ContactProfileForm](ContactProfileForm.md)): person or general,
the context it belongs to, the fields of that kind, further details and
notes, and what a model proposed from the conversations. Shown in Settings > Hub and in the
Dashboard's settings panel
([HubSettingsPanel](../widgets/HubSettingsPanel.md)), so it imports only
from the extension's own ui folder (`WidgetDom.esc` for escaping and
`ContactProfileForm`; see [HubSection](HubSection.md)).

## Behaviour

- The help text states the rules: the same address, the same name on one
  app, or the same full name within one context is one person; the same
  name on different apps in two contexts is only suggested, because people
  share names; summaries use this to know that a Slack name and a mail sender are the
  same person, and what is recorded under About tells the assistant who
  each one is to the user.
- Suggestions sit above the list, one row per pair: `Same person?` with
  both names and where each appears, then `Same person`
  (`mergeContacts(a.id, b.id)`, so the first keeps its name) and `Different
  people` (`keepContactsApart(a.id, b.id)`, and the pair is not suggested
  again).
- The search box (`Find a person, address, app or relation`) reloads the
  list `SEARCH_DEBOUNCE_MS` = 250 ms after typing stops; it also matches
  what is known about a contact. At most `SHOWN` = 60 people are listed,
  most recently seen first.
- One block per person (`.ext-hub-person`, `data-contact`): a tick box, the
  name in an editable field, the notification count and an `About` button
  (`data-action="toggle-profile"`, `Close` while open; only when the reply
  carried `kinds`). Changing the name saves it at once (`renameContact`).
- Under the name, an about line (`data-role="about"`): the kind's label and
  the contact's `about`, `Person: ex-wife; born 31 October 1992 (age 34)`,
  followed by `Suggestions to look at under About.` when a model's
  suggestions wait. A contact that belongs to a context (`homeContextId`)
  has the context's name after the kind: `Person, Vendera: Vendera
  Employee`, or `General, Artella` with nothing else recorded. A general
  contact with nothing recorded, no context and nothing waiting has no
  line.
- Under it, one badge per identity (`data-identity`, the handle as tooltip):
  `<app>, <context name>: <display name or handle>`, the context left out
  when the identity has none. A person with two or more identities has a
  `Split` button on each (`splitContactIdentity`): this is someone else, so
  it becomes a person of its own.
- About opens the contact's form under its block; one form is open at a
  time, so opening another closes the first. The open form is scrolled into
  view. The form is given the contexts the section read (`[{ id, name }]`),
  which is what its `Belongs to` select offers. Inside it, the kind buttons redraw the fields for that kind, `Add a
  detail` adds a row and `Remove` drops one (nothing is saved until Save).
- `Save` sends what the form says (`ContactProfileForm.read`) through
  `saveContactProfile(id, { kind, fields, details, notes, contextId? })`
  (the context only when the form has the select) and reports
  `Saved.`; the reload shows the profile as the Hub stored it (a birth date
  in its one form).
- `Suggest from conversations` saves what is typed and unsaved first, then
  calls `learnContact(id)`. While the model reads, the button is disabled
  and says `READING` = `Reading what they sent you...`. The reply is
  reported as `Nothing this contact sent is in the log yet.` (nothing was
  read), `<n> suggestion(s) to look at.` or `Nothing new to suggest from
  their messages.`; an error is reported instead, and the button gets its
  label back.
- Each suggestion in the form has `Accept` and `Dismiss`
  (`resolveContactSuggestion(id, suggestionId, accept)`, reported as `Added
  to what is known.` or `Dismissed.`). What is typed and unsaved is saved
  first (`_keepTyped`), so accepting builds on it instead of losing it.
- A redraw keeps unsaved typing: before the list is drawn again (a search,
  an action, a change event), `_unsaved` compares the open form with what it
  said when it was drawn and, when it differs, takes it as typed
  (`ContactProfileForm.capture`) and puts it back into the new form
  (`ContactProfileForm.restore`), half-filled detail rows included.
- `Merge ticked` folds every ticked person into the first ticked one, one
  `mergeContacts` call each, so the first keeps its name. With fewer than
  two ticked it only says `Tick two or more people to merge.`.
- Every action reports on the tab's notice line (`Name saved.`, `Split into
  a person of its own.`, `Merged.`, `Kept apart.`, the About messages
  above, or the error) and reloads the section.
- Empty state: `Nobody yet. People appear here as notifications arrive.`,
  or `Nobody matches.` while a search is typed.

## Methods

- `new PeopleSection(tab)` (see [HubSection](HubSection.md)).
- `focus({ contactId, name = '' })`: shows one contact with its About form
  open. It puts the name in the search box and marks the contact as the
  open one; it takes effect at the next `load`. Does nothing before `bind`
  or without a `contactId`. The Dashboard's settings panel calls it when a
  person is clicked in the Activity widget
  ([HubSettingsPanel](../widgets/HubSettingsPanel.md)`.openPerson`).
- `load()`: reads the people for the current search (with `suggestions`
  and `kinds`) and the contexts (for their names in the badges and the
  about line, and for the form's `Belongs to` choices; a failed read of the
  contexts leaves the badges without one and the form without the select).
- `unbind()` also clears the pending search timer.

## IPC

`listContacts({ query, limit })`, `listContexts`, `mergeContacts(intoId,
fromId)`, `splitContactIdentity(identityId)`, `renameContact(id, name)`,
`keepContactsApart(aId, bId)`, `saveContactProfile(id, patch)`,
`learnContact(id)`, `resolveContactSuggestion(id, suggestionId, accept)`.

## Why

What the user records here is what the assistant reads about a person, so
the form is never thrown away behind their back: a reload while they type
puts the typing back, and an answer to a suggestion saves what they typed
before applying it. The model's suggestions wait in the form because
nothing a model reads out of messages is kept until the user accepts it.

# ContactProfile

`extensions/personal-hub/contacts/ContactProfile.js`

The rules of what the Hub keeps about a contact beyond its name: whether it
is a person or a general contact (a business, or someone not placed yet),
the fields that kind has, further contact details, notes for the assistant,
and what a model proposed that the user has not decided on. Cleans what the
user, a tool or a model sends, joins two profiles when contacts merge, and
words a profile as the short text the assistant reads. Plain functions over
plain objects: [ContactService](ContactService.md) loads and stores them
(`hub_contacts.kind` and `hub_contacts.profile`, see
[HubSchema](../HubSchema.md)).

## Kinds

`KINDS` describes the form of each kind, in order; the settings form
([ContactProfileForm](../ui/settings/ContactProfileForm.md)) is drawn from
it and `ContactService.kinds()` hands it out.

- `person` (`Person`): `relation` (`Relation to you`, text), `birthday`
  (`Birth date`, type `birthday`, read by [BirthDate](BirthDate.md)) and
  `sex` (`Sex`, a choice of `female`, `male`, `other`).
- `general` (`General`): `what` (`What it is`, text) and `website`
  (`Website`, text).

Each field is `{ key, label, type, hint?, options? }`, `type` being `text`,
`birthday` or `choice`. `PERSON` = `person` and `GENERAL` = `general`; an
unknown kind is treated as `general`.

## The profile

`{ fields: { key: value }, details: [{ label, value }], notes, suggested:
[{ id, key, label, value, why, at }], dismissed: [string] }`. Limits:
`MAX_FIELD` = 120 characters per field, `MAX_NOTES` = 2000 for the notes,
`MAX_DETAILS` = 20 details with labels of `MAX_LABEL` = 40 and values of
`MAX_VALUE` = 200, `MAX_SUGGESTED` = 12 waiting suggestions and
`MAX_DISMISSED` = 60 remembered dismissals (the newest kept).

## Methods (static)

- `cleanKind(kind)` -> `person` or `general` (trimmed, lower case). Throws
  `A contact is a person or a general contact, not "<kind>".`.
- `read(stored)` -> the profile shape above from whatever was stored: a
  missing or malformed part becomes empty, details without a label or a
  value and suggestions without an id or a key are dropped.
- `isEmpty(profile)`: no field set, no detail and no notes (suggestions do
  not count).
- `apply(kind, current, patch = {}, { now })` -> the profile after a change,
  for a contact of `kind`. Fields of the other kind are dropped first.
  `patch`:
  - `fields: { key: value }`: each given key is set, `''` clears it. A
    birth date is read into its stored form (`BirthDate.parse`, which may
    throw); a choice must be one of its options by value or label, else
    `<Label> is one of female, male, other, not "<text>".`. A key the kind
    does not have throws `"<key>" is not something a <kind> contact has
    (<keys>).`.
  - `details: [{ label, value }]`: replaces the list.
  - `addDetails: [{ label, value }]`: each is added, or updates the detail
    with the same label (any case); an empty value removes it. Entries
    without a label are skipped. More than `MAX_DETAILS` throws `A contact
    holds at most 20 further details.`.
  - `notes`: replaces the notes (lines kept, blank lines dropped).
  - `addNote`: one line more under the notes.
  Suggestions and dismissals pass through unchanged.
- `merge(intoKind, into, fromKind, from)` -> `{ kind, profile }` for two
  contacts that became one. What `into` says stays; `from` fills the fields
  it leaves blank, adds its details with other labels and its notes (the
  same notes are not repeated). The suggestions and the dismissals of both
  are kept, a claim waiting on both only once. The kind is `into`'s, except
  that a blank `into` (`isEmpty`) of another kind takes `from`'s kind.
- `propose(kind, current, proposals, { now, makeId })` -> the profile with
  new suggestions. `proposals` are `[{ key, value, why }]`, `key` being
  `kind`, a field of either kind, `note` or `detail:<Label>`. Each is
  cleaned like an edit (a birth date into its stored form, a choice to its
  value) and labelled (`Kind`, `Note`, the detail's label or the field's
  label). One is left out when it does not read, says what the profile
  already says (the same kind, a note the notes already contain, the same
  detail, the same field value), is already waiting, or was dismissed
  before. `makeId()` names each new suggestion, `at` is `now`. At most
  `MAX_SUGGESTED` wait.
- `accept(kind, current, suggestionId, { now })` -> `{ kind, profile }`
  with the suggestion applied and gone from the list. A `kind` suggestion
  changes the kind; a field of the other kind changes the kind with it (a
  relation makes a contact a person); a note is added as a line, a detail
  through `addDetails`. Throws `That suggestion is no longer there.`.
- `dismiss(current, suggestionId)` -> the profile without the suggestion,
  its claim (`key=value`, lower case) added to `dismissed` so it is not
  proposed again. Throws `That suggestion is no longer there.`.
- `role(kind, current)` -> who this is in a few words: a person's
  `relation`, a general contact's `what`, `''` when not known.
- `about(kind, current, { now, max = ABOUT_CHARS })` -> everything known as
  one line for the assistant, the kind's fields in order (a birth date as
  `BirthDate.describe` words it), then `Label: value` per detail, then the
  notes with their line breaks as `; `, all joined by `; `:
  `ex-wife; born 31 October 1992 (age 34); Phone: 555 0100; still on
  friendly terms`. Cut to `ABOUT_CHARS` = 280 with a trailing `...`; `max`
  0 gives the whole. `''` for a blank profile.

## Why

A contact is either a person or a general contact: a business, an
organisation, or someone the user has not placed yet. New contacts start
general (the column's default), since the Hub cannot tell from a sender's
name alone, and the fields follow the kind: a relation and a birth date
mean something for a person, what it is and a website for a business.

The form is described by data (`KINDS`), so the settings form is drawn from
it rather than written out a second time, and the checks here read the
same list. The field names are also written out in words in
[ContactProfilePrompt](ContactProfilePrompt.md)`.SYSTEM` and in the
`hub_update_contact` and `hub_suggest_contact_details` tool descriptions
([HubTools](../HubTools.md)), so a new field needs those updated too.

A model only proposes. What it reads out of messages waits as a suggestion
until the user accepts or dismisses it, and a dismissed claim is remembered
so the same model reading the same messages does not propose it again.

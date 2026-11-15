# ContactProfileForm

`extensions/personal-hub/ui/settings/ContactProfileForm.js`

The form under a contact in the people section
([PeopleSection](PeopleSection.md)): what the Hub keeps about it for the
assistant. A contact is a person or a general contact (a business, or
someone not placed yet) and the fields follow the kind, drawn from the form
the main process describes (`kinds`, which is
[ContactProfile](../../contacts/ContactProfile.md)`.KINDS`); further details
(a phone number, an address) and free notes can be added, and what a model
proposed from the conversations waits here to be accepted or dismissed.
Static functions only; PeopleSection handles the clicks and the calls.
Imports only `WidgetDom` from the extension's ui folder.

## The form

- The root `.ext-hub-profile` carries `data-profile` (the contact id) and
  `data-kind` (the kind shown now).
- A segmented switch (`Kind of contact`), one button per kind
  (`data-action="kind"`, `data-kind`, `active` and `aria-pressed` on the
  current one), with the help `A business, an organisation or anyone not
  placed yet is general.`.
- The fields (`data-role="fields"`), one labelled row each
  (`LABEL_WIDTH` = 132px for the label): a text input for `text` and
  `birthday` fields, the hint as placeholder, and a select for a `choice`,
  `Not set` first. Each control has `data-profile-field` (the key). A
  birth date without a year is stored as `--10-31` and shown as `10-31`.
- The details (`data-role="details"`), one row each (`data-detail`): a
  label input (`data-detail-label`, placeholder `Phone, address, works
  at`), a value input (`data-detail-value`) and `Remove`
  (`data-action="remove-detail"`). `Add a detail`
  (`data-action="add-detail"`) adds an empty row.
- The notes (`data-profile-notes`), a textarea with the placeholder
  `Anything the assistant should know: how you get on, what they usually
  want, how to answer them`.
- When suggestions wait (`data-role="suggested"`): `Suggested from
  conversations. Nothing here is kept unless you accept it.`, then one row
  per suggestion (`data-suggestion`, the suggestion id) reading `Label:
  value (why)` with `Accept` (`data-action="accept-suggestion"`) and
  `Dismiss` (`data-action="dismiss-suggestion"`).
- `Save` (`data-action="save-profile"`) and `Suggest from conversations`
  (`data-action="learn"`, titled `Have the Hub's model read what this
  contact sent you and propose details. Nothing is saved until you accept
  it.`).

## Methods (static)

- `html(contact, kinds)` -> the form's HTML. `contact` is as
  `listContacts` gives it (`{ id, kind, profile: { fields, details, notes,
  suggested } }`); `kinds` is `[{ kind, label, fields }]`. An unknown kind
  shows the first kind's fields.
- `setKind(root, kind, kinds)`: the user picked another kind; the switch
  and `data-kind` follow and the fields are drawn again, empty, for that
  kind. Nothing is saved until Save.
- `addDetail(root)`: adds an empty detail row and focuses its label.
- `read(root)` -> `{ kind, fields: { key: value }, details: [{ label, value
  }], notes }`, trimmed: what Save sends. Every field of the kind is sent,
  so an emptied one clears; detail rows without a label or a value are left
  out.
- `capture(root)` -> the same shape exactly as typed, half-filled detail
  rows included, so a redraw can put it back.
- `restore(root, typed, kinds)`: puts back what `capture` took from an
  earlier drawing of the same contact's form: the kind (redrawing the
  fields when it differs), every field value it holds, the detail rows and
  the notes.

## Why

The fields come from the main process instead of being written here, so
the form shows what the Hub stores and checks. It is listed in the
manifest's `dashboard.assets` because the Dashboard serves widget files
unbundled: PeopleSection imports it, and the Dashboard's settings panel
shows PeopleSection
([PersonalHubExtension](../../PersonalHubExtension.md)).

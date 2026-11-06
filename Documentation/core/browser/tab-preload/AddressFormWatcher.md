# AddressFormWatcher

`core/browser/tab-preload/AddressFormWatcher.js`

Address and contact autofill, page side (tab preload, isolated world, http(s) pages only). A field takes part when
its form holds at least three different [AutofillFields](../../vault/AutofillFields.md) kinds and no password field.
Sign-in forms belong to [LoginFormWatcher](LoginFormWatcher.md). Labels come from `aria-label`, `<label for>` and a
wrapping `<label>`.

- Focus sends `vault:profile-focus` `{ rect }`; focus moving inside the page sends `vault:field-blur`.
- A submit, or a click on a submit button, sends `vault:profile-capture` `{ fields }` (select values as their option
  text) when [AutofillFields](../../vault/AutofillFields.md) says the form is worth saving. The same values within 3 s
  count as one submit.
- `vault:do-fill-profile` `{ profile }` fills every address field of the last focused form; a `<select>` gets the
  option whose value or text matches case-insensitively.

## Methods

- `new AddressFormWatcher(ipcRenderer, window)`, `install()`, `keyOf(el)`, `labelOf(el)`, `scopeOf(el)`,
  `fieldsIn(scope)`, `isAddressScope(scope)`, `fill(profile)`.
- Statics: `valueOf(el)`, `selectOption(el, value)`, `setValue(el, value)`.

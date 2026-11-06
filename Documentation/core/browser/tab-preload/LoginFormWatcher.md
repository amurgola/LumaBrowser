# LoginFormWatcher

`core/browser/tab-preload/LoginFormWatcher.js`

The page side of the password manager, in the tab preload's isolated world on http(s) pages. Page scripts never see
it. It decides nothing about sites: main reads the tab URL itself.

- Sign-in fields: password inputs, plus the username field of a form with a password (an `autocomplete` username or
  email hint, else the last visible text field before the first password). A field focus sends `vault:field-focus`
  `{ kind, newPassword, rect }`. `newPassword` comes from `autocomplete="new-password"` or two password fields in one
  form.
- Focus moving inside the page sends `vault:field-blur`; focus leaving the page (to the autofill list) does not.
- A submit, an Enter in an input, or a click on a submit-like control sends `vault:capture` `{ username, password }`
  once per pair within 3 s. Submit-like means a real submit button, or a button labelled like sign in, next or
  continue; a "show password" eye is not. A change form reports the last password typed (the new one). A form
  with a username and no password reports the username alone.
- `vault:do-fill` from main fills the form of the last sign-in field through the native value setter plus `input` and
  `change` events, so framework forms see it. `{ generated: true }` fills the new-password fields.

## Methods

- `new LoginFormWatcher(ipcRenderer, window)`, `install()`, `classify(el)`, `scopeOf(el)`, `passwordsIn(scope)`,
  `usernameIn(scope, firstPassword)`, `fill(data)`.
- Statics: `isPassword`, `isTextual`, `isVisible`, `isSubmitLike`, `isNewPassword`, `setValue`.

## Two-factor code fields

`isOtp(el)`: `autocomplete="one-time-code"`, or a text / tel / number field named like a code (otp, 2fa, verification code...) with no maxlength or one of 6 to 8. Focus reports `kind: 'otp'`; `vault:do-fill` `{ otp }` fills the focused code field (or the first one in its form).

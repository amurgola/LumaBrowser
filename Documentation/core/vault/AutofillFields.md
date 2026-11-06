# AutofillFields

`core/vault/AutofillFields.js`

The address and contact fields autofill knows (`KEYS`: fullName, givenName, familyName, email, phone, organization,
street, line2, city, region, postalCode, country; `LABELS` for Settings). Shared by the tab preload, which uses it to
tell which field is which, and main, which uses it for what a profile holds. Cards are deliberately absent.

## Methods

- `AutofillFields.classify({ tag, type, autocomplete, name, id, placeholder, label })` -> a key or null. The last
  `autocomplete` token wins (`shipping street-address`), then `type=email` / `type=tel`, then `PATTERNS` over name,
  id, placeholder and label. Search, captcha, coupon, username and login fields are refused, as are passwords and
  other non-text inputs.
- `valueFor(profile, key)` the value for a field, joining given + family into a full name or splitting a full name at
  its last space.
- `clean(fields)` known keys only, trimmed, at most 300 characters.
- `isWorthSaving(fields)` three fields or more including a street or an email.
- `summary(profile)`, `sameProfile(a, b)` (same street and postal code, or the same email when neither has a street),
  `covers(profile, captured)` (every captured value already saved).

# RuntimeInstallError

`core/shared/runtime/install/RuntimeInstallError.js`

An `Error` with a stable `code` and optional `detail` for install failures the
UI can act on.

## Methods

- `new RuntimeInstallError(message, code, detail)`; `detail` is only set when
  given, so `'detail' in err` matches the legacy errors.

## Why

Legacy built these by hand (`const err = new Error(...); err.code = ...`) in a
dozen places. Callers still read `err.code` and `err.detail`; it is still an
`instanceof Error`.

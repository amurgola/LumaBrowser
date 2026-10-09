# IpcEnvelope

`core/shared/ipc/IpcEnvelope.js`

The IPC result envelope every `ipcMain.handle` handler is wrapped in, so the
renderer always receives `{ success, ... }` and never a rejected invoke.

## Methods

- `IpcEnvelope.enveloped(fn)` returns an async handler. `fn` returns the
  PAYLOAD, not the envelope: `ipcMain.handle('x', IpcEnvelope.enveloped(() => svc.getView()))`.
  - nullish payload -> `{ success: true }`
  - plain object -> `{ success: true, ...payload }`
  - plain object with any own `success` key -> returned untouched
  - anything else (array, string, number) -> `{ success: true, data: payload }`
  - throw or rejection -> `{ success: false, error: message, ...errorFields(err) }`
  - `this` and all arguments are forwarded to `fn`.
- `IpcEnvelope.raw(fn)` returns `fn` unchanged. It marks a handler as
  deliberately not enveloped.
- `IpcEnvelope.errorFields(err)` returns the cloneable own enumerable fields of
  an error, excluding `message` and `stack`.
- `IpcEnvelope.isCloneable(value)` is true for values that survive Electron's
  structured clone: primitives (including bigint), `null`, `Date`, arrays and
  plain objects whose contents are cloneable. Functions, symbols and class
  instances are false.

## Why

Hundreds of handlers repeated the try/catch envelope, and many did something
slightly different; the inconsistency was the debt. The shape was lifted from
the whisper-server handlers, which already had it right.

Every own error field is copied rather than an allowlist (`code`, `detail`,
`runtimeId`, `installable`, ...), because an allowlist silently drops each new
field. Fields are filtered to cloneable values so a function on an error cannot
turn a handled failure into a broken IPC call.

A payload that already carries `success` passes through so existing handlers
(validation early-returns like `{ success: false, error: 'id required' }`) can
be wrapped without editing their returns. Arrays go on `data` because spreading
them produces indexed keys.

`raw` exists because some renderers negate getter values directly
(`!(await api.getCollapsed())`); wrapping those would invert behaviour.

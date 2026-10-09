# PasskeyShim

`core/browser/PasskeyShim.js`

Page source that suppresses unsolicited passkey prompts, so Windows never pops
its modal "Sign in with a passkey" dialog over the app on page load.

## Methods

- `PasskeyShim.SOURCE` is the self-invoking main-world page script (a string).
  It is idempotent (guarded by a non-enumerable `window.__lumaPasskeyShim`) and
  never throws into the page.

## Behaviour

- `PublicKeyCredential.isConditionalMediationAvailable()` resolves `false`,
  which well-behaved sites check before asking.
- `navigator.credentials.get()` with `publicKey` and either
  `mediation: 'conditional'` or no active user gesture returns a promise that
  stays pending, like a user who never picks the autofill entry. It rejects
  only when the site's `AbortSignal` aborts (with the signal's reason, or an
  `AbortError` DOMException).
- A passkey request backed by a user gesture, and any non-passkey request, go
  to the native `get`. The patched `get` reports `function get() { [native code] }`.

## Why

GitHub, Google and Microsoft call `credentials.get()` with conditional
mediation on load, meaning "offer my passkey in the username autofill". Chrome
shows that inline; Electron has no autofill UI, so the request falls through to
the OS and Windows opens a modal dialog on every visit, stealing the foreground
from the user or the desktop agent. A sign-in the user starts by clicking still
reaches Windows Hello.

Injected with ChromeObjectShim by the identity layer in every frame (sign-in
widgets are often cross-origin iframes) and by `webview-preload.js`, so it must
stay a plain string with no requires and stay on the bytecode skip list.

# InternalBearerInjector

`app/ready/InternalBearerInjector.js`

The one `onBeforeSendHeaders` listener each session gets.

## Methods

- `new InternalBearerInjector({ apiSecurity, port })`; `port` is the gateway port
  at boot.
- `attach(session)` installs the listener once per session (false when already
  hooked or no session).
- `headersFor(details)`: [ClientHintHeaders](../../core/browser/identity/ClientHintHeaders.md)`.rewrite`
  on every request; for a request to `http://127.0.0.1:<port>/` with API keys
  required and no `Authorization` header, adds `Authorization: Bearer <first key>`.
  A policy read that throws leaves the rewritten headers.

## Why

Electron allows one `onBeforeSendHeaders` listener per session, so the client
hints and the bearer share it. The in-app pages (LLM tab, dashboard, artifact
tabs) are served from the guarded gateway and need the bearer when keys are
required. The policy is read per request, so a key rotation applies at once.
Requests from outside the process never pass here and must bring their own key.

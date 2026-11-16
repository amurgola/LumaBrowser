# InternalBearerInjector

`app/ready/InternalBearerInjector.js`

The one `onBeforeSendHeaders` listener each session gets.

## Methods

- `new InternalBearerInjector({ apiSecurity, port })`; `port` is the gateway port
  at boot.
- `attach(session)` installs the listener once per session (false when already
  hooked or no session).
- `headersFor(details)`: [ClientHintHeaders](../../core/browser/identity/ClientHintHeaders.md)`.rewrite`
  on every request. A request to `http://127.0.0.1:<port>/` with API keys
  required and no `Authorization` header gets `Authorization: Bearer
  <apiSecurity.internalToken()>` when it is one of ours:
  - a tab opening a gateway page (`resourceType` `mainFrame`), or
  - a request whose frame, parent frame, top frame or referrer is a gateway
    page (the page's own fetches, a frame it embeds, a worker it started).

  Any other request to the gateway, a web page's own `fetch` above all, gets
  nothing. A policy read that throws leaves the rewritten headers.

## Why

Electron allows one `onBeforeSendHeaders` listener per session, so the client
hints and the bearer share it. The in-app pages (LLM tab, dashboard, artifact
tabs) are served from the guarded gateway and need a credential when keys are
required. The policy is read per request, so a change applies at once.
Requests from outside the process never pass here and must bring their own key.

The credential used to be the user's first API key, added to every request for
the gateway whichever page sent it, so any web page open in a tab could call the
API with the user's key. Now it is [ApiSecurity](../../core/shell/ApiSecurity.md)'s
per-launch token, it goes only to requests a gateway page stands behind, and the
token stands in for a required key and nothing more: the gateway still refuses a
foreign page or a cross-site navigation that carries it. It also means "require
an API key" works before any key has been created.

A page cannot set its frame address or its referrer to an address that is not
its own, which is what makes those a safe test.

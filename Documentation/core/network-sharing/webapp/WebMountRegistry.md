# WebMountRegistry

`core/network-sharing/webapp/WebMountRegistry.js`

The extra surfaces core modules and extensions mount on the web backend
([WebAppServer](WebAppServer.md)) under their own prefix, such as `/tab` for
tab sharing: an Express router and/or a raw WebSocket upgrade handler.

## Methods

- `WebMountRegistry.normalizePrefix(prefix)`: `'/tab/'` and `'tab'` -> `'/tab'`;
  `''`, `'/'` and nullish -> `null`.
- `WebMountRegistry.RESERVED_PREFIXES`: `/sharing`, `/share`, `/hooks`, `/llm-ui`.
- `register(prefix, { router, upgrade })` returns an unregister function. Throws
  `registerMount: a non-root prefix like "/tab" is required`,
  `registerMount: "<p>" is reserved by the web backend`,
  `registerMount: router must be an Express router` or
  `registerMount: upgrade must be a function`. Registering a prefix again
  replaces the entry; a stale unregister function does not remove the newer one.
- `mountFor(pathname)`: the entry owning the path (the prefix itself or below
  it, never a lookalike like `/table` for `/tab`), or null.
- `createDispatcher()`: a fresh Express router for a newly built app, with every
  current prefix wired in; prefixes registered later are wired into it as they arrive.
- `dispatchUpgrade(req, socket, head)`: hands the upgrade to the owning mount's
  `upgrade`; returns false when no mount takes it.

## Why

Dispatch looks the entry up per request, so a mount added or removed while the
listener is up takes effect without a restart. Auth is the mount's business
(the precedent is a high-entropy token in the path, see ShareRouter); the web
backend still applies its origin policy first.

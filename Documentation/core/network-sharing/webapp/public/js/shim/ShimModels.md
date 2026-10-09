# ShimModels

`core/network-sharing/webapp/public/js/shim/ShimModels.js`

The shim's `listModels` and the model-list self-heal.

## Methods

- `new ShimModels({ api, serverEvents, win, doc })`.
- `list()`: `{ success: true, models, defaultRef (first id or null) }` with each
  model in the desktop shape (`ShimModels.toDesktop`: `ref`, `label`,
  `providerId` = text before `::`, `providerType` `local`/`openai`, `isLocal`,
  `ready: true`). Unauthorized propagates; other failures give
  `{ success: false, models: [], error }`.
- `startProbing()`: probes on `online`, on the tab becoming visible, and every
  15 s while visible; returns the interval id.
- `probe()`: fires `{ type: 'providers-changed' }` on `serverEvents` only on the
  empty-or-unknown to available transition, so a picker that came up empty
  (host rebooting) refills without a reload.

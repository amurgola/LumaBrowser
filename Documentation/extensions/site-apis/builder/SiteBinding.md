# SiteBinding

`extensions/site-apis/builder/SiteBinding.js`

Binds a builder conversation to its site record. Shared by `SiteApiBuilderMode.buildTurn` and the `use_tab`
tool.

## Methods

- `resolve(service, conversationId, data)`: from `data.siteId` (an existing site) or `data.partition` plus
  `data.origin` (finds the site through `service.store.findSite({ partition, origin })`, else creates it with
  `service.createSite({ name: hostname, origin, partition, startUrl, conversationId })`). Points the site's
  `conversationId` at this conversation when it differs. Answers `{ site, patch }` where `patch` is the meta
  update to persist (`siteId`, `partition`, `origin`, and `startUrl` when the data had none); `{ site: null, patch }`
  when the data names no site (a stale `siteId` is cleared by the patch).

## Decisions

- One site per partition + origin, as the Design says; a second builder conversation on the same tab reuses the
  record and takes over its `conversationId`.

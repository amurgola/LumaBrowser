# SiteApiStore

`extensions/site-apis/SiteApiStore.js`

Plain queries over the Site APIs tables answering hydrated records (JSON columns parsed, camelCase keys). Every
endpoint write passes through `EndpointSpec.normalize`, so a stored script is always one the runner can replay.

## Methods

- Sites: `listSites()`, `getSite(id)`, `findSite({ partition, origin })` (the identity of a site),
  `getSiteByConversation(conversationId)`, `createSite({ name, origin | startUrl, partition, login, conversationId, id? })`
  (the id is a unique slug of the name; the origin is derived from the URL), `updateSite(id, patch)`,
  `setSiteStatus(id, status, note)`, `deleteSite(id)` (endpoints and runs first).
- Endpoints: `listEndpoints(siteId?)`, `getEndpoint(id)`, `getEndpointByName(siteId, name)`,
  `createEndpoint({ siteId, name, description, params, steps, returns, policy, status? })`,
  `updateEndpoint(id, patch)` (the merged definition is re-validated), `setEndpointStatus(id, status)`,
  `deleteEndpoint(id)`.
- Runs: `startRun({ endpointId, siteId, kind, params })` answers the run id; `finishRun(id, { ok, fault, result, stepsLog, durationMs })`
  caps the result at `RESULT_CAP`, writes the endpoint's `lastRun` summary and prunes to `RUNS_KEPT` per endpoint;
  `getRun(id)`, `listRuns(endpointId, limit)` newest first.
- Helpers: `normalizeLogin(login)`, `originOf(url)` (http(s) only), `slug(text)`.

## Decisions

- Writes use plain UPDATE / INSERT so the extension database's table scanner never sees `ON CONFLICT ... DO UPDATE SET`.
- Record ids come from `core/database/RecordId` (`sapi_`, `srun_` prefixes); site ids are human slugs because they
  appear in tool names.

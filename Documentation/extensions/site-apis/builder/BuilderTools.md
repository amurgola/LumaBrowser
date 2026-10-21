# BuilderTools

`extensions/site-apis/builder/BuilderTools.js`

The handlers of the builder tools. Every handler receives `(params, ctx)` with `ctx.conversationId` and
`ctx.assistantMessageId` (what `ToolDispatch._runInjected` passes a mode tool) and acts on the site and endpoint
the conversation's meta names ([BuilderMeta](BuilderMeta.md)).

## Methods

- `new BuilderTools({ service, browser, getChatStore, logger })`.
- `build()`: the specs from [BuilderToolSpecs](BuilderToolSpecs.md) with handlers attached.
- `listPersistedTabs()`: `{ success, tabs }` from [PersistedTabs](PersistedTabs.md), with a note when empty.
- `useTab({ tabId }, ctx)`: binds the conversation (partition, origin, startUrl, sourceTabId), creates or
  reuses the site through [SiteBinding](SiteBinding.md), renames the chat "Site API: <site>", and tells the
  model to end the reply (the work tab opens on the next turn).
- `defineSite({ name?, startUrl?, login? }, ctx)`: `service.updateSite`, login merged over the stored rules.
- `defineEndpoint({ name, description, params, returns? }, ctx)`: creates a `draft` with a placeholder
  `navigate startUrl` script (or redefines an existing one by name), stores `endpointId`, the recording marker
  `{ endpointId, name, messageId: ctx.assistantMessageId, at }` and `returnsDeclared` in the meta.
- `compileEndpoint({ name?, examples? }, ctx)`: reads the calls since the marker through
  [RecordedCalls](RecordedCalls.md)`.collect` (earlier turns from the persisted trace, this turn from
  `ctx.trace`, so the demonstration compiles in the same reply), compiles them with
  [TraceCompiler](TraceCompiler.md) (prepending `navigate startUrl` when needed), validates, stores the steps and
  answers `{ steps, returns, warnings, dropped, recordedCalls }`. With nothing recorded it answers
  `NOTHING_RECORDED` (demonstrate first, selector plus llmFallback on every action). A compiled script that
  fails validation is returned unsaved with the error so the model can fix it with `set_steps`. Without
  `ctx.trace` (older callers, tests) only the persisted path is used.
- `setSteps({ steps, params?, returns? }, ctx)`: `service.updateEndpoint`; a validation failure answers the
  store's message verbatim.
- `getEndpoint({ name? })`, `listEndpoints()`.
- `testEndpoint({ name?, params? }, ctx)`: `service.run(siteId, name, params, { kind: 'test' })` shaped by
  `testOutcome(result)`: `{ ok, runId, durationMs, data (JSON truncated to DATA_CHARS with dataTruncated and rowCount), fault, advice, healed, stepsLog: [{ index, kind, ok, ms, via?, note? }] }`.
- `saveEndpoint({ name? })`: status `validated`, answers `toolName` from `ToolNames.endpointTool`.

## Decisions

- A steps write without explicit `returns` passes `{ description }` only, so the store re-infers kind and
  fields from the new steps; otherwise the placeholder script's inferred `text` would stick (the store
  normalizes `{ ...current, ...patch }`). Once the model declares returns (`returnsDeclared`), they are kept.
- Redefining an endpoint by name keeps its id and runs (status back to `draft`, recording restarted).

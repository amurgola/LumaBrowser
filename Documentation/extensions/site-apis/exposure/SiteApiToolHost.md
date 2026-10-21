# SiteApiToolHost

`extensions/site-apis/exposure/SiteApiToolHost.js`

The live `siteapi_<site>_<endpoint>` tool set: one MCP tool per validated endpoint, re-registered on the aggregator
whenever a definition changes. Source id `site-apis-endpoints` (`ext.site-apis-endpoints` in the aggregator), kept
apart from the fixed `ext.site-apis` management set so a refresh never touches the latter.

## Methods

- `new SiteApiToolHost({ store, run(siteId, endpointName, params, opts), getAggregator, logger })`.
- `buildToolSet()`: `{ tools, handler }` for every endpoint with `status === 'validated'`; rebuilds the
  name to `{ siteId, endpointName }` map (`targets()`).
- `refresh()`: `aggregator.registerExtension('site-apis-endpoints', buildToolSet())`; false without an aggregator
  (the chat router is not up yet; the service calls refresh again after the next change).
- `handle(name, args, opts)`: runs `run(siteId, endpointName, args, { kind: 'call', signal })` and answers
  `SiteApiToolHost.reply(result)`; an unknown name or a throw is an error envelope.
- `dispose()`: `unregisterExtension` when registered, clears the map.
- `SiteApiToolHost.reply(runResult)`: success gives `McpReply.ok({ success: true, data, runId, durationMs, healed? })`;
  a fault gives `McpReply.fault({ success: false, fault, advice, runId?, durationMs? })` with `Faults.advice` filled
  in when the runner left it out. Shared with the management tools and the IPC handlers.
- `SiteApiToolHost.definition(site, endpoint)`: `{ name: ToolNames.endpointTool, description, inputSchema: ParamTemplate.inputSchema(params) }`.
- `SiteApiToolHost.describe(site, endpoint)`: `"<description> (Site API on <site name>; returns <kind>[ with fields a, b])"`
  plus `LLM_NOTE` when `EndpointSpec.usesLlm(steps)`.

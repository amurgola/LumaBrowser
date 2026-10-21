# SiteApiManagementTools

`extensions/site-apis/exposure/SiteApiManagementTools.js`

The fixed `site_apis_*` MCP tools published from `mcp-tools.js`; the per-endpoint tools are the
[SiteApiToolHost](SiteApiToolHost.md).

| Tool | Input | Reply (structuredContent on success) |
|---|---|---|
| `site_apis_list` | none | `{ success, sites: [{ id, name, origin, status, statusNote, endpoints: [{ name, toolName, description, params, returns, status, usesLlm, lastRun }] }] }`; `toolName` is null unless validated |
| `site_apis_run` | `{ site, endpoint, params }` | `SiteApiToolHost.reply(service.run(site, endpoint, params, { kind: 'call' }))`; drafts run too |
| `site_apis_show_tab` | `{ site }` | the service's `{ success, tabId }`, or an error envelope |

## Methods

- `SiteApiManagementTools.TOOLS`, `SiteApiManagementTools.HANDLERS`.
- `SiteApiManagementTools.handle(api, toolName, args, opts)`: `api` is `main.getApi()`; null (extension inactive)
  answers `McpReply.error(NOT_ACTIVE)`, never a throw. A handler throw becomes an error envelope.

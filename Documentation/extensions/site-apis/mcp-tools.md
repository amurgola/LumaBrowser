# mcp-tools

`extensions/site-apis/mcp-tools.js`

MCP tools entry loaded by name from the manifest: the fixed management tools of
[SiteApiManagementTools](exposure/SiteApiManagementTools.md) (`site_apis_list`, `site_apis_run`,
`site_apis_show_tab`) dispatched onto `main.js getApi()`. The per-endpoint `siteapi_*` tools are a separate live
set the [SiteApiToolHost](exposure/SiteApiToolHost.md) re-registers whenever a definition changes.

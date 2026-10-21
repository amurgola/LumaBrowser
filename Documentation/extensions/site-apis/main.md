# main

`extensions/site-apis/main.js`

Main-process entry delegating to one `SiteApisExtension` instance: `activate(context)`, `deactivate()`,
`getApi()` (the `SiteApiService`, read by `routes.js` and `mcp-tools.js`) and `builderDescriptor()` (read by
`chat-modes.js`).

# ServiceMethodCompletions

`core/shell/ui/extension-editor/completions/ServiceMethodCompletions.js`

After `db.`, `browser.`, `llm.`, `ipc.`, `events.`, `logger.` or
`sharedServices.`: method names parsed from that property's documentation
(`ServiceMethodCompletions.methodLines`: lines after "Methods:" up to a blank
line or "Properties:", each `name(` or `name -`), inserted as `name()`.

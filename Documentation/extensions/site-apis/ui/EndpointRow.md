# EndpointRow

`extensions/site-apis/ui/EndpointRow.js`

One endpoint under a site card: name, status pill (`validated` / `draft` / `broken`), a `uses LLM` badge when a
step is `llm_transform`, the tool name as a click-to-copy chip (validated endpoints only), the description, a
"Params: ... Last run: ..." line, and the Run, Runs and Delete actions.

## Methods

- `new EndpointRow({ site, endpoint, invoke, reload, runList? })`; `render()`.
- `toggle('run' | 'runs')`: opens a [RunForm](RunForm.md) or loads the [RunList](RunList.md) into the row's
  detail area; the same button again closes it.
- Delete: `Dialogs.confirm`, `deleteEndpoint(id)`, `reload()`.
- Copy: `window.electronAPI.copyToClipboard` when the preload offers it, else the shared `Clipboard.copyText`;
  the chip reads `Copied` (or `Copy failed`) for 1.5 s.

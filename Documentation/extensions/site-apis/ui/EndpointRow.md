# EndpointRow

`extensions/site-apis/ui/EndpointRow.js`

One endpoint under a site card: name, status pill (`validated` / `draft` / `broken`), a `uses LLM` badge when a
step is `llm_transform`, the tool name as a click-to-copy chip (validated endpoints only), the description, a
"Params: ... Last run: ..." line, and the Run, Runs and Delete actions.

## Methods

- `new EndpointRow({ site, endpoint, invoke, reload, openDetails, runList? })`; `render()`. `openDetails` is the
  page's [OpenEndpointDetails](OpenEndpointDetails.md).
- `toggle('run' | 'runs')`: opens a [RunForm](RunForm.md) or loads the [RunList](RunList.md) into the row's
  detail area; the same button again closes it. Opening and closing are recorded in `openDetails`, and a finished
  run records its values and result there before calling `reload()`.
- `render()` reopens the detail `openDetails` remembers for this endpoint, with the Run form's last values and
  result. A run's `reload()` and the `changed` push both rebuild the page, which used to wipe the result within
  half a second of the run (ISSUES.md 2).
- Delete: `Dialogs.confirm`, `deleteEndpoint(id)`, `reload()`.
- Copy: `window.electronAPI.copyToClipboard` when the preload offers it, else the shared `Clipboard.copyText`;
  the chip reads `Copied` (or `Copy failed`) for 1.5 s.

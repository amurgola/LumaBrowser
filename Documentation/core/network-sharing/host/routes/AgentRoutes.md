# AgentRoutes

`core/network-sharing/host/routes/AgentRoutes.js`

`/sharing` routes for the host's custom agents. Routing only; the work is in
[SharedAgents](../SharedAgents.md).

## Methods

- `new AgentRoutes(auth, agents)`; `mount(router)` adds:
  - `GET /agents` (`requireToken`): `{ agents: agents.list() }`.
  - `GET /agents/chat-ui.js` (browser credential, text errors): sends the
    bundle file as `application/javascript`, or the 403 / 404 text.
  - `GET /agents/ui/:file` (browser credential, text errors): a module the
    bundle imports, from `agents.chatUiAsset(file)`, as `application/javascript`,
    or the 403 / 404 text.
  - `GET /chat/modes` (`requireToken`): `{ modes: agents.webModes() }`.

Scripts are sent with `sendFile(basename, { root: dirname })`: a bare absolute
path is dotfile-checked per segment and 404s under AppImage's `/tmp/.mount_*`
prefix (legacy sent the bare path; the route test runs under a `.mount_` folder).

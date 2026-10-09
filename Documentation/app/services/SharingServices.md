# SharingServices

`app/services/SharingServices.js`

Builds Network Sharing.

## Methods

- `new SharingServices(ctx)`; `build()` adds:
  - `sharingNotices` ([SharingNotices](../sharing/SharingNotices.md));
  - `sharingHostService` with the gateway port, the LLM and image servers, the
    voice servers (`{ stt, tts }`), the new-client notifier, the MCP catalog and
    `apiSecurity` (a core API key may stand in for a pairing token);
  - `sharingWebServer` (the PWA backend, with the `/hooks` router),
    `sharingTlsServer`, `rpcLendingService` (published `__lumaRpcLending`), each
    attached to the host;
  - `sharingClientService`, whose resource changes broadcast
    `core.llmServer.serverEvent` `{ type: 'providers-changed', payload: {} }`;
  - the `/sharing` router on the REST gateway (outside `/api`: its own PIN and
    token auth);
  - `sharingPorts` ([SharingPorts](../sharing/SharingPorts.md));
  - publishes `__lumaSharingHostService`, `__lumaSharingClientService`.

Resuming a left-enabled host happens after ready ([SharingResume](../sharing/SharingResume.md)).

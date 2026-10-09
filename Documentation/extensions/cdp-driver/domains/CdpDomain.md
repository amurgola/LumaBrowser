# CdpDomain

`extensions/cdp-driver/domains/CdpDomain.js`

Base class for the CDP domains answered in-process.

## Methods

- `new CdpDomain(server)` stores the [CdpServer](../CdpServer.md) as `_server`.
- `handlers()` -> `{ '<Domain.method>': async (params, { connection, session }) => result }`;
  the base throws.

Implementations: [BrowserDomain](BrowserDomain.md), [TargetDomain](TargetDomain.md), [LumabyteDomain](LumabyteDomain.md).

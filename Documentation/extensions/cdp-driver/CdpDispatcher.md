# CdpDispatcher

`extensions/cdp-driver/CdpDispatcher.js`

Routes one CDP method.

## Methods

- `new CdpDispatcher(server)` builds a method table from every domain in
  `CdpDispatcher.DOMAINS` ([BrowserDomain](domains/BrowserDomain.md),
  [TargetDomain](domains/TargetDomain.md), [LumabyteDomain](domains/LumabyteDomain.md)).
- `dispatch(method, params, { connection, session })`: a table handler if one exists;
  else an unknown `Lumabyte.*` method is `-32601 '<method>' wasn't found`; else the
  command goes to Chromium through [CommandForwarder](domains/CommandForwarder.md).

The table is a Map, so a method named like an `Object.prototype` member is forwarded
rather than resolving to that member.

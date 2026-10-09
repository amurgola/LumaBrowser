# HostManifestBuilder

`core/network-sharing/host/HostManifestBuilder.js`

Builds the shareable-resource manifest a paired client reads, honouring the
share toggles. It never includes API keys, ports, file paths or anything that
mutates the host. One instance per build.

## Methods

- `new HostManifestBuilder({ host, inventory, llmServerService, imageServerService })`:
  `host` is the [SharingHostService](SharingHostService.md) (flags, identity,
  chat router, `getRpcLending`), `inventory` a [HostModelInventory](HostModelInventory.md).
- `execute()` resolves:
  - `instance`: `{ name, id, proto: 1, version }`.
  - `llms`: when the local slot is shared and the chat router lists a local
    model, every installed local model as `{ ref: 'local::<stem>', label:
    'Local · <display>', kind: 'local', current, contextWindow }` (current
    first); if the service cannot list them, the router's local entry with
    `readOnly: true`. Remote models (when shared) as `{ ref, label, kind:
    'remote', providerType }`, skipping `peer:` refs. `contextWindow` is the
    per-request window or null.
  - `gpus` (only when `shareGpus` is on and the lender's `describeShare()` is
    available): `{ available: true, busy, devices }`.
  - `image.generate` / `image.edit`: `{ available: false }` unless shared, else
    `{ available, modelId, modelLabel, endpoint: '/sharing/image/<kind>', models }`.
  - `thinking`: `{ available, positions, hostDefault }` from the running
    server's probed caps and [HostDialPosition](HostDialPosition.md) (default `'default'`).
  Each section fails alone with a `[sharing] manifest ... build failed:` warning.
- `HostManifestBuilder.PROTO` (1).

## Why

Sharing is not transitive: a model that came from another peer is never
re-shared, which avoids leaking a third machine's resources and chained proxy
hops. Whether the thinking dial works is probed from the running chat
template, which a client cannot work out for itself.

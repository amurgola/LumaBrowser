# PeerProviderConfigs

`core/network-sharing/client/PeerProviderConfigs.js`

Registers a peer's shared LLMs as one OpenAI-compatible provider config in the
settings key `llm.providerConfigs`, so the existing remote-provider path serves
them.

## Methods

- `new PeerProviderConfigs(db)`.
- `PeerProviderConfigs.configId(peerId)` is `peer:<peerId>:llm`.
- `register(peer)` replaces this peer's config with
  `{ id, name: '<name> (shared)', type: 'openai', endpoint: '<endpoint>/sharing/llm',
  apiKey: token, selectedModel, models: [{ id: ref, luma_label, luma_context? }],
  peerId, peerManaged: true }`. `selectedModel` keeps the previous pick when the
  host still offers it, else the first model. `luma_context` is the host's
  per-request window, floored, only when positive. With zero LLMs the previous
  config is kept as is (none registered if there was none).
- `unregister(peerId)` removes this peer's configs and resets `llm.provider` to
  `'none'` if the default pointed at one of them.

## Why

A reachable host that reports zero LLMs is usually still warming up after a
reboot; dropping its config left the user on "No model" until a reload. A
deliberate un-share goes through `unregister`.

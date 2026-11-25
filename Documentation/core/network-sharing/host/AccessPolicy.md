# AccessPolicy

`core/network-sharing/host/AccessPolicy.js`

What one sharing credential may use: the host's master settings, with a named
user's overrides ([UserOverrides](UserOverrides.md)) laid on top. A pairing
token, the core API key and a user with no overrides all get exactly the master
settings, and an inheriting user follows later master changes at once.

## Methods

- `AccessPolicy.overridesOf(credential)`: the user's overrides, or null.
- `AccessPolicy.flags(hostFlags, credential)`: the master flags with the user's
  overridden flags replacing theirs. An override can block what the master
  shares or share what the master keeps.
- `AccessPolicy.listOf(credential, field)`: the user's own `llms`,
  `imageModels` or `tools`, or null to inherit.
- `AccessPolicy.restrictsLlms(credential)`, `restrictsImageModels(credential)`.
- `AccessPolicy.imageModelDenied(credential, modelId)`: null when allowed, else
  `model is not available`. Once the user has a list, a missing id is refused.
- `AccessPolicy.narrowManifest(manifest, credential)`: keeps only the user's
  allowed LLMs and image models (in every image slot).

## Where it applies

[SharingHostService](SharingHostService.md) takes the request credential
(`req.sharingToken`) in `getShareFlags`, `buildManifest`, `allowedLlmRefs`,
`imageModelDenied`, `getWebAllowedTools` and `getSharedTurnTools`, and every
route that checks a permission passes it: the model list and chat turns
([LlmModelGate](llm/LlmModelGate.md)), `/resources`, image and video jobs,
voice ([SharedVoice](media/SharedVoice.md)), agents
([SharedAgents](SharedAgents.md)) and GPU lending ([SharedGpuLease](SharedGpuLease.md)).

A user's tool list goes through the same rules as the master list
([WebToolAllowList](WebToolAllowList.md)): catalog names only, and never a tool
the host switched off for its own chat. An agent the host shares keeps its own
model pin and grant, narrowed by the user's tool list when there is one.

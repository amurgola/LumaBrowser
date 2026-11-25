# UserOverrides

`core/network-sharing/host/UserOverrides.js`

The stored shape of one sharing user's permission overrides:
`{ shareFlags, llms, imageModels, tools }`.

- `shareFlags` holds only the flags the user overrides, each `true` or `false`;
  a flag not named inherits the master value. Only flags in
  `HostSettings.SHARE_FLAGS` are kept.
- `llms` (model refs), `imageModels` (image and video model ids) and `tools`
  (agent tool names) are each `string[]` or `null`. `null` inherits the master
  choice; an empty array is a real choice and allows nothing.

## Methods

- `UserOverrides.normalize(raw)`: any input to the shape above (unique trimmed
  strings, at most 500 per list).
- `UserOverrides.isEmpty(overrides)`: true when the user inherits everything.

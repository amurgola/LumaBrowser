# ApiSecuritySettings

`core/shell/settings/ApiSecuritySettings.js`

The Settings face of [ApiSecurity](../ApiSecurity.md). Security sensitive:
key values never reach the panel in bulk.

## Methods

- `new ApiSecuritySettings(apiSecurity)`; `apiSecurity` may be null.
- `ApiSecuritySettings.mask(key)` `<first 6>...<last 4>` for keys longer than
  12 characters, else `******`.
- `getConfig()` the config with every `apiKeys[].key` masked; null without ApiSecurity.
- `revealKey(id)` `{ success: true, key }` for one key, or `Key not found`.
- `setNetworkMode`, `setWhitelist`, `setRequireApiKey`, `createKey`,
  `refreshKey`, `deleteKey` pass through; `updateKeyLabel` masks the key it
  echoes back.
- Without ApiSecurity every call except `getConfig` returns
  `{ success: false, error: 'API security not available' }`.

## Why

Each key ships masked and "Reveal" fetches one value on demand; create and
refresh still return the new value once so it can be shown.

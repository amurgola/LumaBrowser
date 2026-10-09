# RoleplayIds

`extensions/roleplay-mode/world/RoleplayIds.js`

Mints row ids and random per-character seeds.

## Methods

- `RoleplayIds.mint(prefix)` `<prefix>_<time36>_<rand4>`.
- `RoleplayIds.seed()` an integer in `[0, 2000000000)`.

# ping feature

`extensions/desktop-integration/features/ping/index.js`

The worked example of a Desktop Integration feature module (copy the folder to
start a new one; the contract is in the [README](../../README.md#5-feature-modules)).
On by default.

## Routes

- `GET /api/desktop/ping/` (token required) -> `{ success: true, version, features }`:
  the app version and the ids of the features that are on and running. A
  client uses it to test its token; the Windhawk template mod
  `integrations/windhawk/luma-desktop-ping.wh.cpp` calls it.

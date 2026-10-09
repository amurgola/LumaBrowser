# VramLedger

`core/shared/runtime/vram/VramLedger.js`

The in-memory claims behind [VramCoordinator](../VramCoordinator.md):
`serverId -> { devices, bytes, offloadToCpu, role, ts, weights?, resident? }`.

## Methods

- `set(serverId, claim)` overwrites (a restart re-reserves); `get(serverId)`;
  `delete(serverId)`.
- `snapshot()` a copy (devices arrays copied too).
- `debitMap(excludeServerId)` `Map<cardIndex, bytes>` of what every other live
  claim holds. A claim with `weights` matching its device count is spread by
  them, else evenly. Resident claims and claims without devices are skipped.
- `VramLedger.applyDebit(devices, debit)` copies of the devices with the debit
  subtracted from known `freeBytes`, floored at 0; unknown free stays unknown.

## Why

A resident claim is skipped because nvidia-smi already shows its VRAM; the
ledger only exists to cover the mid-load window nvidia-smi cannot see.

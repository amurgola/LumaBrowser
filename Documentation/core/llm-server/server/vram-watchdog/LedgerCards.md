# LedgerCards

`core/llm-server/server/vram-watchdog/LedgerCards.js`

Reads the [VramCoordinator](../../../shared/runtime/VramCoordinator.md) ledger
for the watchdog.

## Methods

- `LedgerCards.fromLedger(ledger)` returns `{ watched, loading, stamps }`:
  `watched` every integer device >= 0 any claim names, `loading` those whose
  claim is not `resident: true`, `stamps` each device's largest claim `ts`.
  Null claims, non-array `devices` and junk device values are skipped.

## Why

A claim's `ts` is monotonic, so a new stamp on a card means a server of ours
just claimed it even if it already reports resident; the watchdog grants that
card its own-load grace.

# PromptCacheRam

`core/llm-server/server/launch/PromptCacheRam.js`

Sizes llama-server's host-RAM prompt cache (`--cache-ram`) for one launch.

## Methods

- `PromptCacheRam.resolve({ setting, ramTotalBytes, weightsInRam, ramOversubscribed, ramPinned, hotswap, supported })`
  returns `{ mib, source, reason }`; `mib: null` emits nothing:
  1. unsupported build: `null`, `'unsupported'`;
  2. setting `'off'`, `false`, `0`, `'0'`: `0`, `'off'`;
  3. a positive number (or numeric string): floored, `'user'`;
  4. RAM pin, hotswap, or an oversubscribed expert pool: `0`, `'auto'`, with a reason;
  5. unknown RAM: `null`, `'default'`;
  6. weights in RAM: 5% of RAM capped at 2048 MiB, else 10% capped at 8192 MiB.
- `SETTING_KEY` (`core.llm.promptCacheRam`), `MAX_MIB`, `SHARE`, `SHARED_MAX_MIB`,
  `SHARED_SHARE`, `SLOT_PROMPT_SIMILARITY` (0.1), `MIB`.

## Why

An evicted slot's KV can be parked in RAM and restored when a prompt with the same
prefix returns. Newer builds default to a flat 8 GiB that never sees the RAM
budget, so the planner sizes it: less when the model's own weights already live in
RAM, none when the pin or hotswap claimed that RAM. Anything else (including
junk) is `auto`. Slot routing by prefix similarity is emitted only with more than
one slot, at llama-server's own default, so a future default change cannot drop it.

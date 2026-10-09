# NinferBytes

`extensions/ninfer-runtime/NinferBytes.js`

Formats byte counts for NInfer's launch-plan notes.

## Methods

- `NinferBytes.format(n)`: `<x.x> GiB` at 1 GiB or more, `<n> MiB` at 1 MiB or
  more, else `<n> B`; invalid input reads as `0 B`.

## Why

The legacy notes used this GiB wording; core's `ByteLadder` (`GB`, varying
decimals) would change user-facing text, so it was kept as is. A later pass
could switch the notes to ByteLadder for consistency with the llama.cpp plans.

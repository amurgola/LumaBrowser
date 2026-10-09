# BestEffort

`core/placement/service/BestEffort.js`

Best-effort reads for the placement classes.

## Methods

- `BestEffort.read(fn)` returns `fn()`, or null when it throws.

## Why

The canvas, test and snapshot probe services that may be absent, stopped or
mid-restart; one unreadable value must not fail the whole reply.

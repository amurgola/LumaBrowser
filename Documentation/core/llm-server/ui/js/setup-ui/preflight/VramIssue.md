# VramIssue

`core/llm-server/ui/js/setup-ui/preflight/VramIssue.js`

Turns one live VRAM watchdog card into a preflight banner issue.

## Methods

- `VramIssue.from(card)`: `{ live: 'vram', card, severity, title, detail, fix: { kind: 'dismiss-vram' } }`. A critical band is an error, low a warning; a nameless card is `GPU <n>`. Sizes use `ByteFormatter.bytes` with zero as `0 B`.

## Globals

None.

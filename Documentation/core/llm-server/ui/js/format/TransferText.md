# TransferText

`core/llm-server/ui/js/format/TransferText.js`

Download progress wording shared by every setup surface.

## Methods

- `TransferText.rate(bytesPerSec)`: `'42.3 MB/s'`, `'250 MB/s'`, `'500 KB/s'`
  (at least `1 KB/s`), or `''` when not measurable.
- `TransferText.eta(ms)`: deliberately coarse: `'a few seconds left'` under 45 s,
  `'about a minute left'`, `'about 9 min left'`, `'about 1h 35m left'`, `''` for
  none. A to-the-second countdown on a multi-GB transfer implies precision the
  estimate does not have.
- `TransferText.downloadSubText({ received, total, bytesPerSec, etaMs })`:
  `'3.1 GB / 4.9 GB · 42.3 MB/s · about 2 min left'`; unknown parts are left out
  (`'1.0 GB downloaded'` without a total).
- `TransferText.SEPARATOR` is `' · '`.

## Globals

None.

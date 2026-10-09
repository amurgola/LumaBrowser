# SummaryBlock

`cli/lib/tui/blocks/SummaryBlock.js`

The line that closes a turn: `▣ done · 2 steps · 1.2k tokens · 41 tok/s · 8.4s` (`stopped` when
aborted). `new SummaryBlock({ aborted, iterations, tokens, secs, tps })`; done on creation.

# GambitReport

`core/llm-server/gambit/GambitReport.js`

Turns scored gambit tasks into the one compatibility number the button
shows, plus the breakdown that makes it actionable. Pure: no I/O, no model.

## Methods

- `GambitReport.build({ results = [], skipped = [], meta = {} })` returns
  `{ version: 1, meta, overall, band, groups, health, coverage, worstDecile, passRate }`.
  - `results` are [Scorer](../eval/Scorer.md)`.scoreTask` outputs for tasks that
    ran; `skipped` is `[{ taskId, group, reason }]`; `meta` is echoed verbatim.
  - `groups[]`: `{ key, label, n, score, passed, failures }` per task group
    (`result.group`, else `category`, else `uncategorized`), in display order.
    `failures` lists failed tasks with only the checks that cost points
    (`!passed && weight > 0`).
  - A derived `health` group (`derived: true`, `detail`, `totals`) is appended
    when any turn ran; see [GambitHealth](GambitHealth.md).
  - `overall` is the mean of group scores; `band` is `band(overall)`.
  - `coverage` is `{ ran, skipped, total, reasons: { [reason]: taskIds } }`
    (reason defaults to `unavailable`).
  - `worstDecile` is the mean of the lowest 10 percent of task scores (at
    least one); `passRate` is passed tasks over ran tasks.
- `GambitReport.band(pct)`: `good` from 0.9, `usable` from 0.7, else `poor`.
- `GambitReport.orderGroups(keys)`: `GROUP_ORDER` first, unknown keys after, A to Z.
- `GambitReport.GROUP_ORDER`, `GambitReport.GROUP_LABELS`.

The console rendering is [GambitReportFormatter](GambitReportFormatter.md).

## Why group means

The headline is the mean of GROUP scores, not tasks. Fifteen web tasks and
three artifact tasks averaged by task would mostly report web performance and
call it compatibility. Skipped tasks leave the denominator entirely (an
offline host is not a broken model) and are explained under `coverage`.

Health rides as its own group so a model that loops or times out loses
headline points, but it is derived from every turn rather than bucketed, so
it comes last.

The band is presentation only; the raw JSON is the real artifact.

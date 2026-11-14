# UncompiledReadsCheck

`core/llm-server/chat/tool-loop/UncompiledReadsCheck.js`

Notes a Site API builder run that keeps reading the page without compiling an
endpoint. Extends [LoopCheck](LoopCheck.md).

## Methods

- `UncompiledReadsCheck.appliesTo(modeTools)`: true when the mode's injected
  tool names include `COMPILE_TOOL` (`compile_endpoint`).
  [ToolLoopMonitor](../ToolLoopMonitor.md) adds the check only then.
- `inspectOutcome(record, history)`: for a page read (`PAGE_READS`:
  `extract_data`, `get_element`, `collect_list`, `get_source`, `observe_page`,
  `screenshot`), counts the unbroken tail of reads that ran
  (`CallHistory.ranStreak`). Every multiple of `STREAK` (4) returns an
  annotating finding `{ reads }`. Any other call that ran (a click, a
  compile, a test) starts the count again; a call held back without running
  does not.
- `PATTERN` = `uncompiled-reads`.

## Why

ISSUES.md 21: asked for fields in a neighbouring table row, the builder model
tried selector after selector with `extract_data` and never compiled, until
its 40 step budget ran out. The arguments differ every time, so
[IdenticalStreakCheck](IdenticalStreakCheck.md) does not fire, and reads are
not searches or inert actions. The note ([LoopFeedback](LoopFeedback.md))
tells the model to compile with the fields that already extract, or to tell
the user which field cannot be extracted as asked.

It applies only to runs that have the compile tool, so an ordinary browsing
agent that reads many pages is never nagged. Repeating the note every fourth
read, rather than on every read past the fourth, keeps the shared
[InterventionLadder](InterventionLadder.md) from reaching its wrap-up level
after a handful of reads.

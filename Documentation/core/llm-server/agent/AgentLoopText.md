# AgentLoopText

`core/llm-server/agent/AgentLoopText.js`

Every model-facing line the agent loop writes into the conversation. Data only
(static strings and small formatters), so the wording lives in one place.

## Members

- Screenshot notes: `SCREENSHOT_ATTACHED` (matched verbatim when it goes
  stale), `SCREENSHOT_STALE`, `SCREENSHOT_HIDDEN` (non-vision handler),
  `SCREENSHOT_STRIPPED` (compactor fallback), `screenshotSize(w, h)`.
- Nudges: `EMPTY_TURN_NUDGE`, `STALL_NUDGE`, `verifyNudge(tool)`, `lastSteps(remaining)`.
- Carried notes: `carriedNotes(tail)`, `emptyReplyNotes(tail)`.
- Results: `toolResult(tool, body)` (the `[Tool Result for X]: ` prefix that
  Compaction relies on), `notAllowed(tool, allowed)`, `evicted(tool, chars)`,
  `overflowShrunk(dropped, tool)`, `truncatedField(kept, length)`,
  `spillHeader(size, path)`, `SPILL_READABLE_HINT`, `SPILL_REQUERY_HINT`,
  `DEFERRED_CALL`.
- Tabs: `NO_BROWSER_TAB_INFO`, `LAZY_TAB_INFO`.
- Run end: `timedOut(timeoutMs, done, max, toolCalls)`, `SUMMARY_INSTRUCTION`,
  `summaryRequest(toolCalls, final)`, `SUMMARY_FALLBACK`.

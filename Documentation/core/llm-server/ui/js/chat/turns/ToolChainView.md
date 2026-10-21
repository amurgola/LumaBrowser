# ToolChainView

`core/llm-server/ui/js/chat/turns/ToolChainView.js`

An agentic run as one collapsible unit: a header ("Validating code…" while
running, "Ran N steps · M failed" once settled) over connector-linked step
cards in their own scroller (auto-followed while running), and the browser-tab
card outside it. Consecutive steps the loop ran as one batch (stamped `_batch`
by [ToolEventReducer](../stream/ToolEventReducer.md)) share a row: a small
header ([ToolLabels](ToolLabels.md)`.batchLabel` while running, "Ran N
together" after) over their cards side by side. Open while running, collapsed once settled unless the user
toggled it. Approval cards (Allow once / Allow for this run / Decline, all
equally easy; a tool in a grant family says what the grant covers, e.g.
"Allow desktop control for this run", or "for this chat" when `grantScope` is
`'chat'`) answer `api.approvalRespond`; takeover cards (I did it, continue /
Skip this step) answer `api.takeoverRespond`. A settled file step opens the file
read-only ("view file"). Each step shows its status at the right: a spinner
while running, a quiet check when done, and the word "Failed" with an alert icon
on an error (the chain and sub-agent heads use the same alert icon).

## Methods

- `create(message)`: the chain element, or `null` without tools.
- `signature(message)`: what the chain draws; the stream rebuilds only when it
  changes, so the spinner's animation never restarts on text deltas. It
  covers each step's tool, status, placeholder flag and batch size, so a
  pending card becoming its run and joining a batch row redraws.
- `updateLiveDetail(chain, message)`: ticks the live steps' detail in place:
  an assembling call's target and byte count, a running tool's progress
  ([ToolCardText](ToolCardText.md)`.progress`). Every running card carries a
  detail node, even empty, so the first progress report has somewhere to land.

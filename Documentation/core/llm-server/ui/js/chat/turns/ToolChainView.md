# ToolChainView

`core/llm-server/ui/js/chat/turns/ToolChainView.js`

An agentic run as one collapsible unit: a header ("Validating code…" while
running, "Ran N steps · M failed" once settled) over connector-linked step
cards in their own scroller (auto-followed while running), and the browser-tab
card outside it. Open while running, collapsed once settled unless the user
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
  changes, so the spinner's animation never restarts on text deltas.
- `updatePendingDetail(chain, message)`: ticks the assembling step's detail in
  place.

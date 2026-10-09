# LiteActionCard

`extensions/ai-chat/ui/lite-panel/LiteActionCard.js`

The side panel's interactive cards, on the same IPC as the LLM tab's. Without
them a gated tool sat unanswerable for two minutes and failed as "No answer".

## Methods

- `LiteActionCard.build(tool, { api, answered, onAnswer })`: an
  `.ai-lite-card` with a title, a detail (first 200 characters) and buttons:
  - approval: "Approve this?", detail `detail || tool`, buttons Allow once
    (`approvalRespond('once')`), Allow for this run (`'run'`), Decline (`'reject'`);
  - takeover: "Needs you", detail `params.reason` or "The page needs you (a
    login or verification step).", buttons "I did it, continue"
    (`takeoverRespond('continue')`) and "Skip this step" (`'skip'`).
  A click calls `onAnswer()`, disables every button of the card, then sends;
  `answered` renders the buttons disabled (a re-render between the click and
  the router's reply must not resurrect them).

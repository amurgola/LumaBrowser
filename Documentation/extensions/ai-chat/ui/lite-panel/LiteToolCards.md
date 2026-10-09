# LiteToolCards

`extensions/ai-chat/ui/lite-panel/LiteToolCards.js`

Reconciles `tool` events into the side panel's cards, mirroring the LLM tab.

## Methods

- `LiteToolCards.reduce(tools, payload)` returns new cards (input untouched),
  or the same array for an unknown phase:
  - `pending`: renames the last pending card, else adds one;
  - `run`: replaces the last pending card (or appends) with a `running`
    card; `ask_user_takeover` becomes a `takeover` card carrying `params`;
  - `approval`: appends an `approval` card with `detail` and `params`;
  - `approval-done`: `reject`/`timeout` stamps the card `error` with
    "Declined"/"No answer"; any other decision removes it (the real run and
    done follow);
  - `done`: stamps the last running, pending or takeover card of that tool
    (or appends) as `done`/`error` with `summary || error`;
  - `cancel`: drops pending placeholders.

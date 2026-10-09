# ErrorCard

`core/llm-server/ui/js/chat/turns/ErrorCard.js`

The card under a failed turn. The raw error picks a plain-language title and
hint (first match wins): context too long, key or permission rejected (offers
Open Setup), rate limited or overloaded, model unreachable, model not ready
(offers Open Setup), else "Something went wrong.". The raw text is shown
underneath in small mono. A Stop before any text (`stopped`) is a muted card
with no detail. Retry regenerates the turn in place and is offered on the
newest reply only (an older failed turn retries from its action row).

## Methods

- `create(message)`: the card element (`.cm-error`, `role="alert"`).
- `ErrorCard.describe(error)`: `{ title, hint, setup, muted }`.

## Globals

None.

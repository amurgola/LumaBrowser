# ReplyChoices

`core/llm-server/ui/js/chat/turns/ReplyChoices.js`

The "Suggest replies" fence: a ```choices block of short replies ending an
answer. Tolerant of a JSON array or one option per line (list markers and quotes
stripped) and of a missing closer; at most four.

## Methods

- `ReplyChoices.parse(markdown)`: `{ text, choices | null }`.
- `ReplyChoices.stripStreaming(raw)`: cuts from the opener on, for the live body.

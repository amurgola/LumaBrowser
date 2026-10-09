# CountPhrase

`core/llm-server/chat/outline/CountPhrase.js`

A count with its noun: `1 item`, `300 items`.

## Methods

- `CountPhrase.of(count, singular, plural = singular + 's')`.
- `CountPhrase.noun(count, singular, plural)`: just the noun.

## Why

Keys, fields, items and chars are counted on many lines; one helper keeps the
grammar right everywhere.

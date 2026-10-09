# StringPreview

`core/llm-server/chat/outline/StringPreview.js`

Quotes the start of a string.

## Methods

- `StringPreview.quote(text, maxChars = 48)`: the whole string as a JSON
  literal when short, else a JSON literal of the first `maxChars` characters
  followed by `…` outside the quotes. Never splits a surrogate pair.

## Why

The quoted part stays a valid JSON string, and the ellipsis outside it makes
"there is more" unambiguous. 48 characters (about a dozen tokens) is enough to
recognise HTML, a URL or a sentence.

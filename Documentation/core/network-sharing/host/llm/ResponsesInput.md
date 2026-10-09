# ResponsesInput

`core/network-sharing/host/llm/ResponsesInput.js`

Translates an OpenAI Responses API request into chat messages and image attachments.

## Methods

- `ResponsesInput.toMessages(body)` returns `{ messages, images }`:
  - non-blank `instructions` become a leading system message;
  - a string `input` is one user message;
  - an array `input` keeps message items (no `type`, or `type: 'message'`),
    role defaulting to `user`; string content as is, part arrays as their
    `text` values joined by newlines (no text, no message);
  - `input_image` parts with a `data:<mime>;base64,` URL become `{ name:
    'input_image', mime, base64 }`; http(s) image URLs are skipped;
  - any other `input` gives `messages: null` (a 400).

## Why

The host never fetches remote content on a client's behalf. Non-message items
(function calls, references) have no chat equivalent.

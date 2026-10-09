# NtfyPublisher

`extensions/ntfy-notifier/NtfyPublisher.js`

Delivers one push notification through an ntfy server (ntfy.sh or
self-hosted): POST the text to `<server>/<topic>`; every device subscribed to
the topic gets a push.

## Methods

- `NtfyPublisher.send(params, { fetchImpl = fetch, timeoutMs = 15000 })`.
  `params`: `{ channel, message, url?, title?, priority?, tags?, username?, password? }`.
  Resolves `{ success: true, status, message }` (the message tells the model
  to tell the user it was sent) or `{ success: false, status?, error }`. Never
  throws.
- Validation, before any call: `channel` required and matching `TOPIC_RE`
  (`[-_A-Za-z0-9]{1,64}`), `message` non-blank, server a valid `http:` or
  `https:` URL. `url` defaults to `DEFAULT_SERVER` (`https://ntfy.sh`).
- Headers: `x-title` (trimmed, when non-blank), `x-priority` (integer clamped
  1 to 5), `x-tags` (comma list or array, trimmed, blanks dropped),
  `authorization: Basic ...` when a username is set.
- Failures: 401/403 add a "check the username and password in Settings" hint;
  every non-2xx carries `ntfy answered <status>` plus the first 300 response
  characters; a timeout reads `timed out after <n>s`.

## Why

The fetch is injectable so the transport is tested offline. Server and
credentials come from [NtfySettings](NtfySettings.md), never from the model.

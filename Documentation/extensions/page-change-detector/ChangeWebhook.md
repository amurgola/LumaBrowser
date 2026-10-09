# ChangeWebhook

`extensions/page-change-detector/ChangeWebhook.js`

Posts a detected change event to a monitor's webhook.

## Methods

- `new ChangeWebhook({ post? })`: `post` defaults to `axios.post`.
- `send(url, event)`: posts the event as JSON with a 10 s timeout; resolves
  `null` on success or the error message on failure (logged), never rejects.

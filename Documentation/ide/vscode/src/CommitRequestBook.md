# CommitRequestBook

`ide/vscode/src/CommitRequestBook.js`

Pending commit-message drafts, matched by requestId.

## Methods

- `open(send)`: `send(requestId)` puts the frame on the wire; resolves the draft text or rejects ("Could not reach
  LumaBrowser." when sending failed). `settle(payload)` for `commit-message-result`; `failAll(reason)`.

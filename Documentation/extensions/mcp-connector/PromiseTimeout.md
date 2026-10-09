# PromiseTimeout

`extensions/mcp-connector/PromiseTimeout.js`

Bounds a promise with a deadline.

## Methods

- `PromiseTimeout.wrap(promise, ms, label)`: settles like `promise`, or
  rejects `<label> timed out after <ms>ms` at the deadline. The timer is
  cleared when the promise settles.

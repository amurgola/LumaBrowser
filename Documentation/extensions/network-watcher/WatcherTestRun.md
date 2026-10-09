# WatcherTestRun

`extensions/network-watcher/WatcherTestRun.js`

Sends a sample capture through a temporary watcher so the user can check a
webhook before saving.

## Methods

- `new WatcherTestRun(watcherService, { now? })`.
- `execute(config, sample)`: adds a watcher from `config` with note `[TEST]
  <note>`, forwards a sample capture `{ url: urlPattern, method (default GET),
  timestamp, request: { headers }, response: { status 200, JSON body } }` and
  always removes the watcher again. Resolves the `forwardToWebhook` reply;
  throws the service's validation error (duplicate pattern, bad `sendTo`).
- `WatcherTestRun.SAMPLES`: `ipc` (header `Test`, message "...from Network
  Watcher") and `api` (header `X-Test`, message "...from Network Watcher API").

## Why

The capture goes through `NetworkWatcherService.forwardToWebhook`, so header
redaction and the recorded capture apply to test sends exactly as to real ones.
The two samples differ only because legacy's two copies did; receivers may
tell them apart, so both are kept.

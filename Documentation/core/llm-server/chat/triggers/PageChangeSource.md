# PageChangeSource

`core/llm-server/chat/triggers/PageChangeSource.js`

The page-change-detector extension as a trigger source. Extends
[TriggerSource](TriggerSource.md) with `KIND = 'page'`.

## Methods

- `new PageChangeSource({ triggerStore, runner, getDetectorApi })`, where
  `getDetectorApi` is `extensionManager.getApi('page-change-detector')`.
  `emitEvent` is accepted by callers but unused.
- `ensureSubscribed()`, `stop()`, `upstream()` as in the base; the upstream is the
  detector API and subscription is `api.onChange(cb)`, which returns the
  unsubscribe function.
- `onChange(payload)` delivers the change to every page trigger whose
  `source.monitorId` equals the payload's `monitorId`, skipping triggers that have
  a sample but are not enabled. The dedupe key is `page:<monitorId>:<checksum>`
  (or `null` without a checksum). A payload without a monitor id is ignored.
  Returns the deliveries.
- `listMonitors()` returns `[{ id, name, url, enabled, lastStatus, changeCount }]`
  from `api.getAllMonitors()`, or `[]` without a detector or when it throws.
- `getMonitor(id)` returns one of those or `null`.
- `sampleFor(monitorId)` builds a synthetic event (`synthetic: true`) from the
  monitor and its latest `api.getHistory(id, 1)` entry when the detector keeps
  one. Throws `page monitor not found: <id>`.
- `PageChangeSource.eventFor(payload)` returns `{ receivedAt, event:
  'page-changed', monitorId, monitorName, url, changedAt, checksum, prevChecksum,
  diffSummary, textPreview, textLength, changeCount }` with defaults.

## Why

The detector already knows how to notice a web page changing (hidden tab,
selectors, checksum, diff) but could only notify or POST a webhook. Its public
API exposes `onChange(cb)`; this source turns those changes into trigger runs.
The API is fetched through a getter so a missing or disabled extension simply
means "no page triggers fire".

A sampled but unarmed trigger is skipped because it has already captured its
sample and is waiting for the user to arm it; an unarmed trigger with no sample
still receives the event so the runner can capture it.

`sampleFor` backs `set_sample` and the "Use latest check" button.

# TriggerSampleEvent

`core/llm-server/chat/trigger-runner/TriggerSampleEvent.js`

Turns a user-supplied sample into the event it stands for, by trigger kind.

## Methods

- `TriggerSampleEvent.for(trigger, body, pageSource)` (async), throwing a
  user-facing error:
  - `file`: a path (string or `{ path }`) to an existing file inside the watch
    folder -> `FileEventBuilder.forPath(dir, path)`; else `a file trigger sample
    is the path of a file inside the watched folder`.
  - `page`: `pageSource.sampleFor(monitorId)`; else `the page watcher is not
    available`.
  - `notification`: `NotificationSource.syntheticEvent(body)`, scoped to the
    trigger's own `host` and tab partition (`persisted: true`); an empty body
    throws `a notification sample is the notification text, or JSON { title,
    body }`.
  - `webhook`: `TriggerPayload.syntheticEvent(body)`.

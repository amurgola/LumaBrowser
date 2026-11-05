# SharedMediaJob

`core/network-sharing/host/media/SharedMediaJob.js`

Base of one client media request (image or video) run on the host's own slot
and streamed back as NDJSON: the refusal check, the stream headers, FIFO
queueing, disconnect abort and usage banking. Subclasses
([SharedImageJob](SharedImageJob.md), [SharedVideoJob](SharedVideoJob.md)) say
which router, queue lane and share flag apply and map the request body onto
that router.

## Methods

- `new SharedMediaJob(service)` (a [SharingHostService](../SharingHostService.md)); `run(req, res)`.
- Subclass hooks: `_refusal()` (null, or `{ status, body }`; sets `this._router`
  when ready), `_enqueue(fn)`, `_generateOnRouter()`, `_countDelivered(payload)`
  (items the `done` event carried), `_usageDelta()`, `_defaultError()`.
- `SharedMediaJob._refuse(status, error)` builds a refusal.

## Behaviour

1. `run` reads `body.model` (trimmed, else null), asks `_refusal()`, and sends a
   refusal with [RouteReply](../routes/RouteReply.md) before any stream.
2. Streams `application/x-ndjson` lines `{ type, payload }` from the router's
   `send`; the run is queued through `_enqueue`.
3. A thrown run sends an `error` line. Finally the items of `done` events are
   banked through `service.recordUsage` and the response ends.
4. A client disconnect before the end marks the job aborted; a still-queued job
   then resolves `{ success: false, aborted: true }` without running. Only a job
   that has started calls `router.abort()`.

## Why

The router serves one render at a time, so a queued job whose client left must
not abort the render that is running for someone else; the started flag keeps
the abort to the job that owns the slot. Nothing is written on the host: the
media travels back base64 inside the `done` event and the client stores it.

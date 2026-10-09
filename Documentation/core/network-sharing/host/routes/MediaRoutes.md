# MediaRoutes

`core/network-sharing/host/routes/MediaRoutes.js`

`/sharing` image and voice routes. Routing only.

## Methods

- `new MediaRoutes(service, auth)`; `mount(router)` adds:
  - `POST /image/generate`, `POST /image/edit` (`requireToken`): a new
    [SharedImageJob](../media/SharedImageJob.md) per request.
  - `GET /voice/status` (`requireToken`): [SharedVoice](../media/SharedVoice.md)`.status()`.
  - `POST /voice/prewarm`, `/voice/transcribe`, `/voice/synthesize`
    (`requireToken`, then `SharedVoice.gate()`): `prewarm()`, `transcribe(req)`
    (with `express.raw` for `audio/wav`, `audio/wave`, `audio/x-wav` and
    `application/octet-stream` up to 25 MB), and a new
    [VoiceSynthesisStream](../media/VoiceSynthesisStream.md).

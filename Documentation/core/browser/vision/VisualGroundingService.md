# VisualGroundingService

`core/browser/vision/VisualGroundingService.js`

"Find the thing that looks like X" on a live tab. The DOM path (refs, selectors,
the LLM selector resolver) fails on exactly the pages this exists for: icon-only
divs with click listeners, canvas UIs, custom widgets. A vision model looks at the
tab's screenshot and answers with a point, which is then clicked with real input.

## Methods

- `new VisualGroundingService({ llmService, tabManager, db, nativeImage, resolutionCache })`.
  Registers the optional LLM slot `visual-grounding` ("Visual grounding (vision model
  that finds elements on screenshots)"), so the user can route a dedicated grounding
  model (Holo, MAI-UI, UI-Venus) while chat runs on something else; unset, it
  follows the global provider like every slot. Public fields `llmService`,
  `tabManager`, `db`, `resolutionCache`, `imageOps` ([ImageOps](ImageOps.md)).
- `isAvailable()`: a provider is routed for the slot (it may still lack vision).
- `profile()`: the [GroundingProfiles](GroundingProfiles.md) profile for the slot's
  model, or the one named by setting `core.vision.groundingProfile`.
- `locate(tabId, { description, zoom = false, noCache = false })` ->
  `{ success, data: { x, y, bbox?, target, profile, refined, ms } }` in viewport CSS px,
  `target` being what `tabManager.pointInfo` finds there. A validated cache hit is
  served first as `{ x, y, bbox, target, selector, resolvedBy: 'cache' }`, even with
  no model routed. Otherwise: `NO_PROVIDER` without a provider, the slot's vision
  check (`ensureSlotVision`, which loads a managed local slot's projector), a
  CSS-scaled screenshot, `locateInImage`, then the point is remembered in the cache
  before anything clicks (a click may navigate away).
- `locateInImage(image, description, { zoom, what = 'the screenshot', skipVisionCheck = true })`
  -> `{ success, data: { point, bbox?, profile, refined, ms } }` in image pixels, for any
  scale-1 image (desktop windows, game frames). Failures: `NOT_FOUND` (the model
  said the element is not there) or `GROUNDING_FAILED`.
- `clickDescribed(tabId, { description, zoom, button, clickCount })`: a cached hit
  clicks first (a plain left click through `clickElement` with the selector when
  the selector's first match is the validated element, else `clickAt` the point)
  and reports `resolvedBy: 'cache'`; a failed cached click drops the entry. Then
  locate (no cache) and `clickAt`, reporting `located` and `resolvedBy: 'vision'`.
- Statics: `SLOT_ID`, `PROFILE_SETTING`.

Completions go to the slot with `needsVision: true`, a 120 s timeout (the first
call may load the projector; image prefill is slow) and label `Visual grounding`;
the reply text comes from [ResponseText](../../llm-service/ResponseText.md).
[GroundingClient](GroundingClient.md) does the prompt, coordinate conversion and
optional zoom refine; [CoordinateSpace](CoordinateSpace.md)`.imageToCss` maps to the viewport.
Calibration measured about 96% of real clicks landing on target for five local models, zoom off.

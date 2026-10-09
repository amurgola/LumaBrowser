# VisionAvailability

`core/shell/extensions/VisionAvailability.js`

Whether an image passed to `context.chat.complete` would reach the model.

## Methods

- `VisionAvailability.check(modelRef, llmServerService, fsOps = fs)`:
  a non-empty ref not starting `local::` is true (remote models are the user's
  pick); a live server plan answers with `mmprojPath || mmprojAvailable`;
  otherwise true when the configured model's folder has a `*mmproj*.gguf`.
  False on any error or missing service.

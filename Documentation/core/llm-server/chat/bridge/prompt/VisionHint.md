# VisionHint

`core/llm-server/chat/bridge/prompt/VisionHint.js`

The prompt line telling a vision model the attachments are already visible.

## Methods (all static)

- `forTurn(imageCount, visionActive)`: the hint (singular or plural wording),
  or null with no images or no vision.

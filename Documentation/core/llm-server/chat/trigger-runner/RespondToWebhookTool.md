# RespondToWebhookTool

`core/llm-server/chat/trigger-runner/RespondToWebhookTool.js`

The `respond_to_webhook` tool of a webhook trigger in `result` mode: sets the
HTTP body the sender receives for this event (the last call wins). The webhook
receiver ([WebhookSource](../triggers/WebhookSource.md)) sends it with the run.

## Methods

- `new RespondToWebhookTool(onBody)`.
- `definition()`: `{ name: 'respond_to_webhook', description, inputSchema: {
  body }, handler }`. A string body longer than `MAX_BODY_CHARS` (256 KB) is
  cut; an object whose JSON exceeds it is refused with `response body too
  large`; otherwise `onBody(body)` and `{ success: true }`.

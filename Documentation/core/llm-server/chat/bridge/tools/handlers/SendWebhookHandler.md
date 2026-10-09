# SendWebhookHandler

`core/llm-server/chat/bridge/tools/handlers/SendWebhookHandler.js`

`send_webhook`: the programmatic group's outbound write. A
[ChatToolHandler](ChatToolHandler.md).

## Methods

- `new SendWebhookHandler({ tool = new SendWebhookTool() })`.
- `execute(_, params)`: `tool.execute(params)`.

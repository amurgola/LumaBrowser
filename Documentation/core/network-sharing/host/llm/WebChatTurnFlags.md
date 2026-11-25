# WebChatTurnFlags

`core/network-sharing/host/llm/WebChatTurnFlags.js`

The chat flags the web app sends with a chat turn, so the host runs it the way
the desktop chat runs the same turn. Only the web chat sends them; a paired
desktop client builds its own prompt and sends none.

| Body field | Read as |
|---|---|
| `luma_conversation_id` | `clientConversationId` (marks a web chat turn) |
| `luma_plan` | `plan`, the client's stored plan |
| `luma_media_models` | `mediaModels`, the chat's image, edit and video picks |
| `luma_choices` | `choicesOn` ("Suggest replies") |
| `luma_voice` | `voiceOn` (spoken style) |
| `luma_disabled_tools` | `disabledTools`, the chat's switched-off tools |

## Methods

- `WebChatTurnFlags.of(body)`: `{ isWebChat, clientConversationId, plan,
  mediaModels, choicesOn, voiceOn, disabledTools }`.
- `WebChatTurnFlags.narrow(allowedTools, disabledTools)`: the allowed tools
  less the switched-off ones; a client can only narrow what the host grants.

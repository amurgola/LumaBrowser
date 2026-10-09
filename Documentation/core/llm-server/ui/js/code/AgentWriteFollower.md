# AgentWriteFollower

`core/llm-server/ui/js/code/AgentWriteFollower.js`

Follows the agent's `write_file` / `edit_file` steps from the chat's
`luma-chat-tool` events for the open conversation: snapshot before the write,
then refresh and open the file after a successful one (in the background when
the user is mid-edit in another file).

## Methods

- `onTool(detail)` with `{ conversationId, phase, tool, params, success }`.

# TerminalSession

`extensions/code-mode/terminal/TerminalSession.js`

One connected terminal or IDE client.

## Frames

Client -> host: `hello { cwd, agent?, conversationId?, approval?: 'ask'|'never', suggest?, origin?: 'terminal'|'ide', client?, resumeOrNew? }`,
`prompt { text, images?, context? }`, `followup { text }`, `approve { decision }`,
`abort`, `list-agents`, `open-in-app`, `commit-message { requestId?, diff, files?, hint?, cwd? }`.

Host -> client: every router event verbatim, plus `ready`, `busy`, `queued`,
`followup-start`, `agents`, `suggest`, `approve-result`, `abort-result`,
`open-in-app-result`, `commit-message-result` and `bridge-error { message, code }`
(`not-ready`, `bad-cwd`, `no-agent`, `no-model`, `no-conversation`, `not-code`, `no-session`, `empty`).

## Methods

- `hello(p)`: resolves the cwd (a directory, container paths routed), the agent
  by id or name ([TerminalAgents](TerminalAgents.md)), the model (agent pin,
  else default), then resumes or creates the conversation
  ([TerminalConversations](TerminalConversations.md)). A stale resume id is an
  error for an explicit resume, but an IDE client (or `resumeOrNew`) gets a
  fresh conversation and `ready.resumeMissed`. A second hello drops the
  untouched conversation of the first.
- `prompt(p)`: queues during this session's own turn; refuses with `busy` while
  another chat turn is active (it would abort the person at the screen); runs
  `router.chat({ ..., agent: true, tools: true, approvalOverride })` with the
  stored history and the IDE context block on the model message only.
- `followup`, `approve`, `abort`, `openInApp`, `listAgents`, `commitMessage`
  ([CommitMessageDrafter](CommitMessageDrafter.md)), `onTurnEnd` (runs the next
  queued follow-up, else a [FollowupSuggester](FollowupSuggester.md) suggestion
  when hello asked for one).
- `dispose()`: stops side completions, drops a conversation this session created
  and nobody wrote to, and aborts its own in-flight turn.

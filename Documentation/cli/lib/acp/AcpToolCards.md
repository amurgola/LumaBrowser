# AcpToolCards

`cli/lib/acp/AcpToolCards.js`

The bridge's tool frames as ACP tool calls. Pure bookkeeping over the open
cards; [AcpSession](AcpSession.md) sends what this returns as `session/update`
notifications.

## Vocabulary

- `kindOf(tool)`: `read` (read_file, list_dir, project_overview ...), `edit`
  (write_file, edit_file, save_artifact ...), `delete` (discard_build), `execute`
  (run_command, check_process, dispatch_batch, install_extension, validate_code),
  `search` (grep, find, web_search), `fetch` (fetch_page, navigate, click ...),
  else `other`.
- `title(tool, params)`: the [ToolGrammar](../tui/ToolGrammar.md) verb plus detail
  (`Edit src/a.js · 2 edits`, `npm test`, `Grep /x/ in src`).
- `locations(tool, params, cwd)`: `[{ path }]` for the file tools (absolute against
  `cwd`), with `line` for a `read_file` offset.
- `diffContent(tool, params, cwd)`: `{ type: 'diff', path, oldText, newText }` per
  `edit_file` edit; a whole-file diff (`oldText: null`) for `write_file`.
- `OPTIONS`: the permission options `once` (allow_once), `run` (allow_always) and
  `reject` (reject_once); the option ids are the bridge's `approve { decision }` values.

## Phases

- `approval(p)` -> `{ toolCallId, update, request }`: a `tool_call` in status
  `pending` and the `session/request_permission` params (`toolCall`, `options`;
  a `sensitive` call offers no `run`).
- `approvalDone(p)`: a `reject` or `timeout` decision closes the card as `failed`
  (`Declined by the user.` / `Nobody answered the approval request in time.`); an
  allowed one waits for the run frame.
- `run(p)`: the running call; an approved card for the same tool becomes it
  (`tool_call_update` to `in_progress`), else a new `tool_call`.
- `done(p)`: `completed` or `failed`, with the streamed output and the summary or
  error as text content and `rawOutput { success, error?, summary? }`. Matched by
  `callId`, else the oldest running card of that tool, else the oldest.
- `commandOutput(p)`: the running `run_command` card's content is the output so far
  (capped at 64 KB).
- `delegation(p)`: a sub-agent (`agent` frames: start, delta, rollback, done, error)
  as one `Ask <agent>` card filled with its reply.
- `closeOpen(reason)`: every card still open when the turn ends, as `failed`.
- `openCount`.

Ids are `call_<n>` per session.

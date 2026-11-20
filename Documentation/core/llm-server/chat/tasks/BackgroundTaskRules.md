# BackgroundTaskRules

`core/llm-server/chat/tasks/BackgroundTaskRules.js`

Which tool calls may run as a background task, and in which lane.

## Methods

- `refusal(tool, kind)`: null when the call may run in the background, else the reason
  the model is given. `kind` is where the run finds the tool
  ([DetachedToolCalls](../bridge/tools/DetachedToolCalls.md)`.kindOf`: `builtin`,
  `session`, `extension`), null for a tool the run does not have or does not allow. In
  order:
  1. no tool name: says what `run_in_background` needs;
  2. one of the three task tools (`TASK_TOOLS`): a task cannot start or manage another;
  3. no kind: the tool works on the page in this reply's own tab (the browser tools) or
     is not one the model has, so call it directly;
  4. a built-in in `MEDIA_TOOLS` (`generate_image`, `edit_image`, `generate_video`,
     `animate_image`, `generate_music`): allowed;
  5. an extension or MCP tool that does not stay in the reply: allowed;
  6. anything else (other built-ins, session tools, the extension tools below): "does not
     run in the background: call it directly in this reply."
- `laneOf(tool)`: `media` for the media tools, else null (the task starts at once beside
  whatever else runs).

## Tools that stay in the reply

`FOREGROUND_TOOLS` and the `FOREGROUND_PREFIXES` `desktop_` and `game_`: the terminal's
interactive tools (`terminal_list`, `terminal_open`, `terminal_send`, `terminal_read`,
`terminal_close`), delegation (`delegate_task`, `list_delegates`, `chat_with_agent`,
`list_agents`) and the LoRA trainer's tools (`train_lora`, `lora_training_status`,
`cancel_lora_training`, `apply_lora`). They act on what the user is looking at, need an
answer between calls, or (`train_lora`) already report back by themselves through
[ConversationJobs](../jobs/ConversationJobs.md). `terminal_run` is not among them: it
runs in the background and is followed to its end by
[TerminalRunFollow](TerminalRunFollow.md).

## Why one media lane

The image router runs one render at a time and a new render aborts the one in flight.
Renders queued in one [SerialLane](SerialLane.md) run one after the other instead.

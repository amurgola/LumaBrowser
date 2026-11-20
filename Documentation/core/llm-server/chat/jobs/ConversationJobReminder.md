# ConversationJobReminder

`core/llm-server/chat/jobs/ConversationJobReminder.js`

Tells the chat model that work it started in an earlier turn is still running.

## Methods

- `ConversationJobReminder.build(jobs)`: one bracketed line naming each running job with
  how far along it is, or null when nothing is running. It tells the model the work
  continues on its own, that the result will be posted in the conversation, and not to
  start it again.
- `describe(job)`: `Training LoRA "mira" (training, step 240 of 800, about 11:54 left)`.
- `progress(job)`: the words in the brackets alone (`training, step 240 of 800, about
  11:54 left`), or `''` for a job that has said nothing about itself yet. The
  background-task line uses it for a running task's progress
  ([BackgroundTaskTools](../tasks/BackgroundTaskTools.md)).

[AgentTurnDispatch](../router/AgentTurnDispatch.md) leaves the jobs of kind
`background-task` out of this line: those have their own line, asked on every step.

## Why at the tail

The line changes every turn, so it rides with the clock and the format block at the end
of the prompt (TurnReminder) and leaves the cached system prefix untouched.

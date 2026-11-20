# PlanTool

`core/llm-server/chat/plan/PlanTool.js`

What a Tools-on chat turn gets so the model can plan multi-step work: the
`update_plan` session tool, the prompt note on when to plan, the plan restated at the
prompt's tail, a check before the final answer, and the rule that the final answer
completes the plan's last step. Each change is stored on the conversation
([ConversationPlan](ConversationPlan.md)) and sent to the chat as a `plan` event, which
the page draws its plan panel from
([PlanPanel](../../ui/js/chat/plan/PlanPanel.md)).

## Which turns plan

`PlanTool.forTurn(store, { convId, modeTurn, evalOverrides })` returns a tool or null:

- plain chat: yes;
- a mode's turn: only when the mode's `buildTurn` returns `planning: true`. Code mode
  does for every turn that has tools
  ([CodeTurnBuilder](../../../../extensions/code-mode/turn/CodeTurnBuilder.md)); a
  roleplay narrator or a game must not be told to plan;
- an eval run: never, so its task list stays what the eval pinned;
- no conversation id, or a store without `getMeta` and `setMeta`: no.

[AgentTurnDispatch](../router/AgentTurnDispatch.md) is the one caller. Turns that do
not go through it (Network Sharing's `ProxyTurns`, scheduled tasks, triggers) do not
plan.

## The tool

`update_plan({ plan?, done?, explanation? })`:

- `plan`: every step in order, `[{ step, status? }]`, to write the plan or change its
  steps. A step without a status is not started; the first step left to do is the one
  in progress. An empty list clears the plan. [PlanSteps](PlanSteps.md) reads the
  near-miss forms models send; the list is also taken from `steps`, `todos` or `items`.
- `done`: the number (from 1) of the step just finished. It and every step before it
  are marked completed and the next one is in progress. Also read from `completed`,
  `finished` or `complete`, as a number, a numeric string or a list.
- Both in one call: the list is taken first, then the step is marked.

The answer is `{ success: true, summary, next? }` from
[PlanProgressText](PlanProgressText.md): `summary` is `Step 2 of 5: Compare the prices`
(also the line on the tool's card in the thread, so the thread shows where each phase
began) and `next` spells out the exact call that finishes the step in progress. Errors
are worded for the model: `BAD_ARGS` (neither argument readable), `NO_PLAN` (`done`
before any plan), or "There is no step 7: the plan has 3 steps, numbered from 1."
A failed call stores nothing.

## Members

- `extraTool`: `{ name, description, inputSchema, handler }` for the run's `extraTools`
  (forced active and documented from the schema, like a mode's session tools).
- `note`: `PlanTool.NOTE`, appended to the system prompt. It says when to plan (three or
  more separate steps, or steps that depend on each other), to plan before any other
  tool, to call `done` after each step, and not to plan a plain question or a one-step
  request. The text is the same on every turn, so the cached prompt prefix holds.
- `beginTurn(hooks)`: a plan whose every step is completed belonged to the last
  request; it is dropped and a `plan` event with `plan: null` goes out through
  `hooks.onAgentEvent`. A failing store never stops the turn.
- `reminder()`: asked once per request to the model (the bridge's `stepReminder`). The
  whole plan ([PlanReminder](PlanReminder.md)`.build`) on the run's first request, since
  it may come from an earlier turn; one status line (`PlanReminder.status`) on the
  others; nothing on the request right after an `update_plan` call or a held-back
  answer, whose own text has just said the same.
- `beforeFinalAnswer()`: the run's `finalCheck`
  ([FinalAnswerGate](../../agent/FinalAnswerGate.md)). With steps before the last still
  open it returns text naming them, and the answer is held back once: either the work
  is done and only the plan is behind (the model calls `done` and answers again), or
  the model was about to answer with part of the work missing. Null when only the last
  step is open. The gate adds that the user never saw the held answer, so the answer
  after it is the whole report again, with anything found since worked in, not a note
  on top of the first one.
- `watching(hooks)`: the turn's hooks with `onDone` wrapped. A reply that ran to its
  final answer with only the last step open completes that step and sends the `plan`
  event before `done` reaches the chat. A stopped reply (`aborted`) or one cut short
  (`stopReason`) completes nothing, and neither does one that ended with earlier steps
  open: the plan then shows where the work really stands.

## Why these rules (measured 2026-11-17, Qwen3.8-27B, `npm run test:e2e -- plan-and-queue`)

The first version took the whole list on every call, as Codex's `update_plan` does.
Live, the model wrote the plan, did all four steps and only updated it once at the
end, so the panel never showed a phase. What changed that, in the order it was found:

1. A list written without states starts on its first step (the model listed four
   pending steps and went to work).
2. `done: n` instead of rewriting the list: a dozen output tokens where the full list
   cost about a hundred, so an update costs about a second, not three.
3. `done: n` completes the steps before `n` too. The model sent `done: 2` after
   finishing steps 1 and 2 together; marking only step 2 left step 1 "in progress".
4. The status line on every request names the exact call. Restating the whole plan
   every few requests came too late in a run of eight requests.
5. The last step is usually "tell the user", which the final answer itself does, so
   the answer completes it instead of asking for one more call.
6. The check before the final answer: in two runs of three the model finished the work
   and answered with the plan at "2 of 4".

With all six, five runs of five ended with every step completed, four of them marking
each step as it went (the fifth marked steps 1 and 2 together). The whole test (app
launch and both turns) took 48 to 56 s, against 47 s for the first version, which
touched the plan twice. A plain question and a single lookup were not planned.

## Code mode (measured 2026-11-17, same model)

Asked to add a function, write a test, run it and update the README in a small
project, Code mode planned and ended with every step completed in five runs of five,
marking the steps as it went (`ipppp > cippp > ccipp > cccip > cccci > ccccc`). In three
of them it looked at the project (`project_overview`, `read_file`) before writing the
plan, which is the right order for code. Asked only to list and read three files and
compare them, it made no plan: with batched reads that is three requests, and the note
says not to plan a lookup.

## Why one tool, at the tail, in the meta

Checked 2026-11-17 against how other agents do it: Codex's `update_plan` and Claude
Code's todo list both keep an ordered list with one step in progress, shown to the
user and independent of the conversation history, so a compaction cannot lose it;
Manus reports that restating the goal at the end of the context is what stops drift on
long runs. A second planning surface beside this one makes a model hedge between them,
so there is exactly one tool.

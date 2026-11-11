# TEMP: long-conversation regression, what we think is happening and how to test it

Delete this file once the checks below have been run. Branch: `ccr-044c6aaa-a1ufql`.

Nothing here has been run against a real model yet. The fixes were checked by
replaying turns through the real chat bridge with a stubbed model, and by unit
tests. The point of this file is to confirm or kill each hypothesis on a live
local model.

## Symptoms reported

1. Long conversations got much heavier: context floods, looks like the chat is
   re-sent or never trimmed. Normal chat and roleplay.
2. After a few responses, tool use breaks: the model says it did something and
   tells you to go look, without calling anything.
3. Switching model, or stopping and restarting the server, sometimes helps.

## Where it started

Commit `8b343a7c` (Nov 4). It did two things at once:

- prior turns are sent as real user/assistant messages instead of one
  flattened transcript inside the task (`nativeHistory` now defaults on);
- each user turn's exact sent text is stored (`llm_messages.sent_content`) and
  replayed on later turns to keep the server's KV cache byte-identical.

Plain chats always run through the agent bridge (Tools is always on), so all
of the below applies to them. Roleplay only goes through the bridge when the
conversation has Tools on; the mode launcher starts it with Tools **off**.
See "Open question" for what that means.

## Hypotheses

### H1. Every earlier user turn carries stale per-reply blocks (fixed, `dec15983`)

The stored sent text includes things written for one reply only: the artifact
catalog, a mode's post-history prompt (roleplay scene notes), the clock, the
tool-format reminder. Replaying it meant every earlier turn kept its own copy.
Growth is linear per turn and invisible to compaction and to roleplay's own
history trim, because both measure the raw thread first.

Stub replay, extra characters on top of the raw thread at turn 8:
plain chat 2,024 before / 253 after; with a 1,500-char post-history prompt
14,272 before / 1,784 after.

Now: a prior user turn replays as its own text plus any tool manuals it
delivered (`SentForm`).

### H2. A tool manual is lost but stays flagged "delivered" (fixed, `7025837b`)

A group activated after turn 1 has its manual sent once, inside that turn's
user message. A flag then marked it delivered for good. If that message
leaves the history (regenerate, edit, compaction, roleplay trim) the model
has an active group, no manual, and a system prompt listing it as inactive.

Now: pending manuals are worked out from the history being sent
(`ManualDelivery.carriedKeys`); a missing one is sent again.

### H3. History shows answers with no tool calls, and the model copies that (fixed, `53f2370e`)

A turn is stored as its final text. As native turns the history reads
"user asks, assistant says done" with no call in between, repeatedly. This is
the best match for symptom 2.

Now: each earlier answer is preceded by the calls it made, from the stored
trace (`ToolCallReplay`): the fence, then a short `[Tool Result for x]` line.
Long values are clipped and marked, six calls per turn at most.

### H4. Tool-call protocol changes with server state (fixed, `53f2370e`)

With no server running the native-vs-fence decision came from the file name;
with one running, from the launch plan, which reads the GGUF header first. A
renamed or repacked model can get different answers, so the protocol could
change between the turn that starts the server and the next. Possible match
for symptom 3, but unconfirmed: a restart also just reshuffles sampling.

Now: the family the planner last gave a model is remembered and used while
the server is down (`core.llmServer.chat.plannedFamilies`).

### H5. Overflow recovery's shrink was undone (fixed, `dec15983`)

Re-writing the reminder restored a remembered copy of the message, which put
an oversized tool result back after recovery had shrunk it. Found by reading
the code, not reproduced.

## Open question: roleplay with Tools off

H1 to H3 all live in the agent bridge. A roleplay conversation started from
the launcher runs with Tools off, on the plain path, where none of that code
runs. So if roleplay regressed with Tools off, **the cause is not found yet**.
Things to look at in the roleplay run below:

- does `HistoryTrimmer` actually drop turns once the history passes its
  budget, or does the request keep growing;
- is the window the trim is sized against the window the server really has;
- do `<think>` blocks or reply-choice fences ride back in the history;
- do the scene notes appear once (on the newest user message) or more.

First thing to establish: was the affected roleplay chat Tools on or off.

## Test plan

Use one local model for both runs, with a context small enough to hit the
limits quickly (8k to 16k). Run each scenario on the commit before the fixes
(`56a6e5f9`) and on the branch head, and compare.

### Capture

- Turn on LLM call tracing: setting `core.llm.traceCalls`. Each conversation
  writes `<conversationId>.jsonl` under the trace directory
  (`LlmTrace.traceDir()`), one line per model call, with the request messages.
- Roleplay from the terminal: `npm run rp:text -- --ctx 8192 --scenario harbour`
  (add `--model <gguf>` to launch a server, `--judge` for the critic pass).
  The report lands under `tests/e2e/_out/rp-lab/<stamp>-text` and includes a
  per-turn `ContextAudit` (tokens per layer, history size, repeated content).
  Note: the lab drives turns with Tools **off**, so it tests the open
  question, not H1 to H3. For roleplay through the bridge, use the app with
  Tools switched on in a roleplay conversation and read the trace.

### Scenario A: normal chat, 20+ turns

Script for the driving model, one message per turn, in order:

1. Three turns of plain talk, no tools needed.
2. Ask for something that needs a tool group not active yet (an image, or an
   artifact). Expect a real call.
3. Ask for a change to that result. Expect a real call.
4. Two turns of plain talk.
5. Regenerate the last reply.
6. Ask for another tool action in the same group. Expect a real call.
7. Repeat steps 3, 4 and 6 until past 20 turns and past the context window.

### Scenario B: roleplay, 30+ turns

Run `rp:text` at a small `--ctx`, long enough that the history budget is
exceeded several times. Then repeat in the app with Tools on.

### What to measure per turn

| Check | Hypothesis | Healthy | Broken |
|---|---|---|---|
| Request size minus raw thread size | H1 | roughly constant | grows every turn |
| Count of `tool_format_reminder`, `Current time`, `[Scene notes`, `[Artifacts created earlier` in one request | H1 | 1 each (newest message only) | one per earlier turn |
| After activating a group: is `[Tool manuals loaded` present in every later request | H2 | exactly once per request | missing after regenerate or trim |
| For a turn that used a tool: is a ```` ```tool ```` fence present before that answer in later requests | H3 | yes | no |
| Reply claims an action ("I've created", "done", "take a look") with no tool call in the same turn | H3 | never | appears after a few turns |
| System prompt and presence of the format reminder, first turn after a server start vs the next | H4 | identical | differ |
| Request size once the window is passed | all, and the open question | levels off | keeps climbing or errors |
| `prompt_n` in the reply timings (tokens re-read) | cost of the H1 fix | about the previous exchange | most of the conversation |

### Analysis prompt for the local model

Give it one trace file, or one roleplay report, and this:

> You are auditing the requests an app sent to a language model over one
> conversation. Each record is one request: a list of role/content messages.
> For every request, in order, report:
> 1. total characters, and characters excluding the system message;
> 2. how many times each of these appears: `tool_format_reminder`,
>    `Current time (the user's local clock)`, `[Scene notes`,
>    `[Artifacts created earlier`, `[Tool manuals loaded`, `[Tool Result for`,
>    and a ```` ```tool ```` fence;
> 3. any block of 200+ characters that appears more than once in the request,
>    with where each copy sits;
> 4. whether the system message is byte-identical to the previous request's.
>
> Then, for every assistant reply in the conversation: does it claim to have
> performed an action, and is there a tool call in that same turn. List every
> reply that claims an action with no call, with its turn number.
>
> Finish with a table of request size per turn and one sentence per finding.
> Report counts and quotes only. Do not guess at causes.

Counting is better done by a script than by a model; treat the model's
numbers as a pointer and confirm anything surprising with a grep on the file.

## Known risks in the fixes

- H1 fix costs cache: the previous user message no longer matches what the
  server cached from where its tail began, so each turn re-reads the previous
  exchange. Check `prompt_n`.
- H3 fix adds text to history that no budget counts (bounded per turn, not in
  total), and clipped values carry a "more characters not repeated here"
  mark. Watch for a model copying that mark into a real call.
- H4 fix: the first-ever launch of a model can still differ from later turns.

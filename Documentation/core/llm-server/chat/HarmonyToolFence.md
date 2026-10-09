# HarmonyToolFence

`core/llm-server/chat/HarmonyToolFence.js`

Turns a harmony model's captured native tool calls into the ```tool fences the
text-protocol agent parses.

## Methods

- `HarmonyToolFence.build(text, toolCalls, { cutByLength? })` returns `text` with
  one fence per call appended (separated by a blank line), or the fences alone
  when `text` is empty. `toolCalls` are `{ name, args }` from
  [NativeToolCallAccumulator](NativeToolCallAccumulator.md). Returns `text`
  unchanged when there are no named calls or `text` already holds a ```tool
  fence. Each fence body is one of:
  - `{ tool, params }` for a normal call (`functions.` prefix stripped);
  - `{ tool, params: {}, __argsLost: <first 300 chars> }` when the arguments are
    unreadable even after [ToolArgumentParser](ToolArgumentParser.md) repair;
  - `{ tool, params: {}, __argsCut: true }` for the length-cut call when nothing
    usable arrived (empty or unparseable arguments);
  - `{ tool, params, __repaired: true }` for the length-cut call when arguments
    did arrive.

## Why

A harmony tool call lands in `tool_calls`, a field the agent never reads, so the
turn looked empty and the loop treated it as the final answer ("the run ended
before I could wrap up"). Synthesizing the equivalent fence lets the existing
parser run it without teaching the agent native function calling.

Every call is fenced, not just the first. Keeping only `toolCalls[0]` used to
drop the rest silently, so the model reasoned from results it never got or
re-issued them a step later.

Identical calls (same name and arguments) within one completion are collapsed to
the first: that is degeneration, not intent.

Unreadable arguments are marked, never replaced with `{}`. Running a tool with
fabricated empty arguments does something plausible-looking with nothing and the
model trusts the result. The marker lets the run loop fail the call and tell the
model what to fix.

`cutByLength` means the completion finished on the token limit. llama.cpp does
not drop a severed call: it delivers a call cut at its opening brace as `{}` and
heals one cut mid-string into valid but truncated JSON, both indistinguishable
from finished calls without the flag. Only the stream-last call can be the cut
one; since dedupe may have folded it into an earlier copy, the kept call with the
same signature carries the flag. A cut outranks a parse failure: the cut can
land inside an escape, and blaming escapes would send the model to fix something
that was never wrong.

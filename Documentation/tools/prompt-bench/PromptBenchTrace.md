# PromptBenchTrace

`tools/prompt-bench/PromptBenchTrace.js`

Reads the model calls a conversation's LLM trace recorded ([LlmTrace](../../core/llm-server/chat/LlmTrace.md)) and
reduces them to the bench's context figures.

## Methods

- `PromptBenchTrace.parse(text)` returns the trace file's `chat` records (a record with no `callType` counts as
  chat); `title`, `side` and `compact` calls and lines that do not parse are left out.
- `PromptBenchTrace.metrics(records)` returns:

| Field | Meaning |
|---|---|
| `requests` | model calls the case took |
| `model` | the model ref of the first call |
| `systemPrompt` | the system message of the first call, as sent |
| `nativeTools` | how many tool schemas the first call registered (0 on the text fence) |
| `firstPromptTokens` | prompt tokens of the first call: the system prompt plus the first task |
| `contextTokens` | the fullest the context got: the largest prompt plus reply of one call |
| `completionTokens` | reply tokens over all calls |
| `readTokens` | tokens the server had to evaluate (`timings.prompt_n` summed); a reused prefix keeps this far under the prompt size |
| `modelMs` | time inside model calls |

A figure no call reported is `null`, never 0.

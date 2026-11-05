# RequestComplexity

`core/llm-server/chat/RequestComplexity.js`

How much work a chat request is about to start, and the local-server knob that
follows from it.

## Methods

- `RequestComplexity.of({ extra, tools })` returns `'heavy'` or `'light'`: the
  caller's own `extra.complexity` wins; else heavy when any offered OpenAI tool
  schema names a pseudo-tool whose [PseudoToolSchemaTable](tool-schemas/PseudoToolSchemaTable.md)
  entry carries `complexity: 'heavy'`; else light.
- `RequestComplexity.ofAllows(allows)`: the bridge's view, heavy when the run's
  allow-list admits a heavy pseudo-tool, whatever path (native array or fence)
  the tool takes. Non-functions are light.
- `RequestComplexity.heavyToolNames()`: the marked entries' names.
- `RequestComplexity.moeCacheBatch(extra, tools)`: `MOE_CACHE_BATCH_HEAVY` (128)
  for a heavy request, else undefined (the server default stands).
- `HEAVY`, `LIGHT`, `MOE_CACHE_BATCH_HEAVY`.

## Why

A short prompt says nothing about the work behind it: a one-line coding request
runs many tool rounds, each with its own short prompt. The managed llama-server
(LumaByte runtime luma-b5+) serves prompt batches up to `--moe-cache-batch`
tokens through its MoE expert cache and stages every expert of every layer for
anything bigger, which reads the whole expert pool and, on a model bigger than
RAM, takes tens of seconds. A heavy request raises that limit for itself with
the `moe_cache_batch` request field ([OpenAiChatBody](../../shared/llm/OpenAiChatBody.md)),
so its short prompts keep reading the cache and the experts the run keeps
hitting stay warm between rounds; a tool result past 128 tokens (a file, a page)
is a scan either way and takes the staged path. Builds without the field ignore
it. 128 is where the two paths cost about the same on the over-RAM model the
feature was measured on (DeepSeek-V4.1-Flash on luma-b5): a prompt through the
cache path uploads every expert it routes to one miss at a time, so past that
length the staged scan, whose cost is fixed, is the faster of the two.

The marked pseudo-tools are the ones that build or check code and artifacts
(`create_artifact`, `edit_artifact`, `create_live_artifact`, `validate_code`);
[CompletionDriver](bridge/turn/CompletionDriver.md) marks an agent run's
completions from its allow-list, and a compaction summary stays light.

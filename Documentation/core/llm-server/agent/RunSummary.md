# RunSummary

`core/llm-server/agent/RunSummary.js`

One-sentence summary of a finished agent run.

## Methods

- `RunSummary.generate(llm, finalResponse, toolCalls)`: asks the navigator slot
  (`temperature 0`, `max_tokens 60`) with the tool list and the first 500 chars
  of the answer, trimmed to 150 chars (an empty reply stays empty). On a failed
  or throwing call: the answer's first sentence, else `'Task completed'`.

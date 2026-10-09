# RunLogMarkdown

`extensions/timed-tasks/ui/RunLogMarkdown.js`

Formats one run log as the Markdown the "Copy log" button copies.

## Methods

- `RunLogMarkdown.format({ run, task, log })`: a field table (run and task
  ids, status, start, completion or `N/A`, duration, tab id, iterations), then
  with a log: system prompt, appended response-schema instruction, run error,
  a tool-call table (params cut to 80 characters, errors to 60) and the
  per-iteration conversation (assistant text quoted with the `tool` code
  fence removed, tool call and result as JSON, LLM errors); without one,
  `*No detailed log available for this run.*`. Always ends with the request
  prompt (`(none)`) and the final response (`(empty)`).

# RouterPrompt

`core/llm-server/router/RouterPrompt.js`

The tool-group router's prompt contract: the exact text the router model was trained on, its
decoding grammar, and the answer parser.

## Methods

- `RouterPrompt.buildRouterPrompt(message)` returns the Qwen3 chat-layout prompt (system block,
  user message truncated to `MAX_MESSAGE_CHARS`, assistant turn with thinking closed).
- `RouterPrompt.parseRouterAnswer(text)` returns the known group keys in answer order,
  de-duplicated; `[]` for `none`, empty, or anything unparseable.
- Constants: `ROUTER_GROUPS` (frozen key -> description, canonical order), `NONE_DESC`,
  `SYSTEM`, `GRAMMAR` (GBNF: `"none"` or a comma list of router keys), `MAX_MESSAGE_CHARS` (2000).

## Why nothing here may change casually

The router (a Qwen3-0.6B fine-tune, see the System One spike report) was trained on exactly
this text. Any edit must be mirrored in the training harness (`train_qwen_router.py`) and the
model retrained. Key order matters because the model answers in canonical order.
Every router key must also be a real tool group key (a static group or a merged-source
group such as `tool_forge`); the test cross-checks this against ToolGroups and
MergedSourceTable, because the bridge activates whatever the router answers.

The system block is static and comes first so llama-server's prompt cache keeps it and only the
message tokens (~20 instead of ~400) are evaluated per call. The grammar constrains decoding so
parsing can never fail. Messages are truncated because the model was trained on short chat
messages and a pasted wall of text only slows the call.

# BalancedJson

`core/shared/llm/BalancedJson.js`

Finds where a JSON object really ends by counting braces string-aware.

## Methods

- `BalancedJson.extractObject(text, start)` returns the balanced `{...}`
  substring beginning at index `start` (which must be the opening `{`), or
  `null` when the object is truncated before its matching close.

## Why

The tool-fence parser once used a lazy regex, `` /```tool\s*([\s\S]*?)```/ ``,
which closes at the first ```` ``` ```` it meets, including one the model typed
inside a string. A coding agent writing a markdown document that opened a
```` ```bash ```` block had its JSON severed mid-`content`; the repair path padded
it, and 577 bytes of a 7.5 KB document were written over the target file as a
clean success. A string-aware brace count does not care what the payload
spells: a fence, a backtick or a `}` inside a quoted value is just a character.

`null` is a meaningful answer, not a failure. It is how a caller tells "the
model finished this call" from "the model was cut off mid-call", which is the
difference between running it and refusing it.

It is shared because every parser on the tool-call recovery path (the strict
fence reader in BrowserTools, the loose and XML readers in AgentChatBridge, the
game-mode AI bridge) must agree on where a call ends. When they disagreed, the
strict one silently handed a truncated body to the lossy one.

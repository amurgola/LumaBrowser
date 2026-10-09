# ReplyCap

`core/llm-server/chat/bridge/turn/ReplyCap.js`

How many tokens one agent completion may generate.

## Methods

- `new ReplyCap(ctxPerSlot)`.
- `maxTokens(messages)`: undefined without a window; else
  `max(512, min(ctx - promptTokens - 256, ContextBudget.FIXED.minGenerationTokens * boost))`,
  prompt tokens by `TokenEstimator` over the JSON messages.
- `noteLengthCut()`: doubles the boost, up to 4.

## Why

Without a cap llama.cpp runs into the context wall mid-document. A cut retry
fails identically unless the cap grows (observed: 15 edit_artifact calls all
cut to `{}`).

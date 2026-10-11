# ContextBudgetFlow tests

`tests/unit/llm-server/ContextBudgetFlow.test.js`

Shared context snapshots across compaction, agent dispatch and stream metadata; cancellation and superseding turns; network-shared agents.

Run `npm run test:node -- tests/unit/llm-server --runInBand` or `npm test`. These tests do not require installed models or a running inference backend.

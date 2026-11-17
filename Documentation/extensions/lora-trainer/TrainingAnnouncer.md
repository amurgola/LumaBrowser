# TrainingAnnouncer

`extensions/lora-trainer/TrainingAnnouncer.js`

Keeps the conversation that started a training job informed.

## Methods

- `started(job)`: registers the job with
  [ConversationJobs](../../core/llm-server/chat/jobs/ConversationJobs.md) as
  `Training LoRA "<name>"`, with the flow's cancel as its Cancel.
- `progressed(job, { force })`: sends the phase, step counts and time left. Step lines
  are thinned to one every two seconds; a change of phase always goes out.
- `ended(job)`: finishes the job with its state and the text from
  [TrainingOutcomeText](TrainingOutcomeText.md).

A job started outside a chat (an MCP client) has no conversation and is not announced.

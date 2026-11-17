# TrainingJob

`extensions/lora-trainer/TrainingJob.js`

Plain state of one job.

## Members

- Phases: queued, collecting pictures, writing captions, installing the trainer,
  training, adding the LoRA to the library, then one of done, failed, canceled. A stored
  job that never ended reads back as interrupted.
- `enter(phase, detail)`, `note(detail)`, `advance(progress)`, `finish({ lora, applied })`,
  `fail(message)`, `cancel()`, `requestCancel()`, `active`, `snapshot()`.
- `TrainingJob.fromSnapshot(stored)`: a job read back from `job.json`; `wasRunning` tells
  a record written mid-run.
- `ownerPid`: the app process running the job.
- `conversationId`: the chat that asked for it, or null for a call from outside a chat.

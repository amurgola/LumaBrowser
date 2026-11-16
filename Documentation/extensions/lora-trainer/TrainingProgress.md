# TrainingProgress

`extensions/lora-trainer/TrainingProgress.js`

Reads ai-toolkit's console output one line at a time.

## Methods

- `new TrainingProgress(jobName)`; `read(line)` -> `{ step, totalSteps, loss, timeLeft }`
  for the training progress bar (the one labelled with the job name), `{ detail }` for
  any other non-empty line, null for an empty one.

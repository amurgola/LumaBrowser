# TrainingWorkspace

`extensions/lora-trainer/TrainingWorkspace.js`

Clears a job's working files.

## Methods

- `clear(jobId, { succeeded })`: removes the dataset folder (pictures, captions, the
  trainer's latent cache), the output folder (checkpoints) and the job file. A job that
  succeeded also loses its trainer log; one that did not keeps it. Never throws.
- `clearAbandoned(jobIds)`: the same for jobs nobody is running any more.

## Why

The user asked that training leave only the LoRA behind and no copies of their pictures.
The log of a failed run is kept because it holds no pictures and is the only way to read
why the trainer stopped. The trainer runtime and the downloaded base weights are not
per-job files and stay for the next run.

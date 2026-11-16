# TrainingJobs

`extensions/lora-trainer/TrainingJobs.js`

The jobs this app knows.

## Methods

- `create({ request, model, recipe })`: a queued job, written at once; throws `BUSY`
  while another job is running (training owns the graphics card).
- `active()`, `get(id)`, `recent(limit = 10)` (newest first, including earlier sessions).
- `save(job)`: writes `job.json`, best effort.
- `storedIds()`; `abandonedIds()`: job folders whose working files nobody needs (the job
  ended, its record is unreadable, or the app process that ran it is gone).
- `TrainingJobs.processAlive(pid)`.

## Why

`abandonedIds` checks the owning process because several app instances (a test instance
beside the user's own) share the managed base folder: startup cleanup in one must not
delete the dataset of a job the other is training.

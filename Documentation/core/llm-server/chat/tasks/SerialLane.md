# SerialLane

`core/llm-server/chat/tasks/SerialLane.js`

Runs jobs one at a time in the order they were added: the next starts when the one
before it has settled, whether it succeeded or threw.

## Methods

- `push(job)`: `job` is `() => Promise`. Resolves or rejects with the job's own outcome;
  a job that throws does not stop the lane.
- `length`: how many jobs are waiting or running.

## Why

[BackgroundTasks](BackgroundTasks.md) keeps one lane per name. Background renders share
the `media` lane ([BackgroundTaskRules](BackgroundTaskRules.md)) because the image
server runs a single render at a time and a new render aborts the one in flight.

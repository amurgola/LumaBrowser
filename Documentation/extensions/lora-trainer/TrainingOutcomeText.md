# TrainingOutcomeText

`extensions/lora-trainer/TrainingOutcomeText.js`

The outcome message posted into the conversation.

## Methods

- `TrainingOutcomeText.of(job, { logPath })`:
  - finished: the LoRA name, the model, steps, picture count and duration, the trigger
    word, and the next step (ask to apply it, or that it is attached already);
  - failed: the last line of the error, where the trainer log is kept, and the graphics
    card warning when the card was nearly full as training began;
  - stopped: that nothing was added to the library.
- `duration(startedAt, finishedAt)`: `14 min`, `1 h 5 min`.

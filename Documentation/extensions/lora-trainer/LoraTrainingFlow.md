# LoraTrainingFlow

`extensions/lora-trainer/LoraTrainingFlow.js`

The whole flow as one job.

## Methods

- `start(args, controls)`: parses the request ([TrainingRequest](TrainingRequest.md)),
  resolves the model and recipe ([TrainableModels](TrainableModels.md)), picks a free
  library name, creates the job, collects and captions the pictures (steps 1 and 2) and
  only then starts the rest of the run without awaiting it. Resolves the job snapshot.
  Refusals throw, including too few usable pictures. `controls` come from the calling
  chat turn: `isAborted()` (its Stop button) and `onProgress(fields)` (its tool card).
- `cancel(jobId = null)`: flags the job; every step and the trainer process check the flag.
- `settled()`: resolves when the job started last has ended.

## The run

1. Collect the pictures ([TrainingImageSources](TrainingImageSources.md)); fewer than 4 fails the job.
2. Write the captioned dataset ([TrainingDataset](TrainingDataset.md)).
3. Install the trainer when missing ([TrainerRuntime](TrainerRuntime.md)).
4. Stop the image servers, claim a card ([TrainingGpu](TrainingGpu.md)), write the job
   file ([TrainingConfig](TrainingConfig.md)) and run the trainer ([ProcessRunner](ProcessRunner.md)),
   reading its output through [TrainingProgress](TrainingProgress.md).
5. Add the LoRA to the library ([TrainedLoraInstaller](TrainedLoraInstaller.md)).
6. Attach it when `applyWhenDone` ([LoraApplier](LoraApplier.md)); a failed attach leaves the job done.

Steps 1 and 2 run inside the `train_lora` call, steps 3 to 6 in the background. The
split is deliberate: a caption request carries a picture, and the local model server
restarts to load its vision projector for the first one. Done in the background, that
restart hit the chat turn that had just started the job with "503 Loading model" (first
live run, 2026-11-16). Inside the call the chat model is idle, waiting for the tool.

Whatever the outcome, the card is released and the job's working files are cleared
([TrainingWorkspace](TrainingWorkspace.md)): only the LoRA in the library and the job
record remain.

## Notes

Training itself has not been run end to end from this code yet; the live check
(`npm run test:e2e -- lora-trainer`) covers activation, catalog tags and tool answers.

## Telling the conversation

`start(args, controls)` records `controls.conversationId` on the job. Once the dataset is
ready the flow calls `announcer.started(job)`, then `progressed` on every phase change,
install step and trainer line, and `ended` after the working files are cleared
([TrainingAnnouncer](TrainingAnnouncer.md)). A request refused while its dataset is
prepared is answered by the tool call itself and never announced. Without an announcer
the flow is silent.

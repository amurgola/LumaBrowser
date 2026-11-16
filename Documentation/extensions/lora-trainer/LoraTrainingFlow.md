# LoraTrainingFlow

`extensions/lora-trainer/LoraTrainingFlow.js`

The whole flow as one job.

## Methods

- `start(args)`: parses the request ([TrainingRequest](TrainingRequest.md)), resolves the
  model and recipe ([TrainableModels](TrainableModels.md)), picks a free library name,
  creates the job and starts the run without awaiting it. Resolves the job snapshot.
  Refusals throw before anything starts.
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

Whatever the outcome, the card is released and the job's working files are cleared
([TrainingWorkspace](TrainingWorkspace.md)): only the LoRA in the library and the job
record remain.

## Notes

Training itself has not been run end to end from this code yet; the live check
(`npm run test:e2e -- lora-trainer`) covers activation, catalog tags and tool answers.

# TrainingDataset

`extensions/lora-trainer/TrainingDataset.js`

Writes a job's dataset folder.

## Methods

- `build({ dir, images, recipe, trigger, subject, onProgress, isCanceled })` ->
  `{ dir, count, described }`. The folder is emptied first, then each picture is written
  as `0001.png` or `0001.jpg` with its caption as `0001.txt`. A cancel between pictures
  throws with code `CANCELED`.

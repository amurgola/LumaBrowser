# TrainerEnvironment

`extensions/lora-trainer/TrainerEnvironment.js`

Environment for the trainer's child processes.

- `forInstall()`: the app's environment without Python-hijacking variables (PYTHONPATH,
  VIRTUAL_ENV, conda and pyenv settings), with uv's Python and cache kept in the runtime folder.
- `forTraining(cudaDevice)`: the same cleaning, `HF_HOME` in the trainer's cache, telemetry
  off, unbuffered UTF-8 output, and `CUDA_VISIBLE_DEVICES` when a card was chosen, with
  `CUDA_DEVICE_ORDER=PCI_BUS_ID` so the nvidia-smi index the card was picked by is the
  index CUDA uses.

# TrainingGpu

`extensions/lora-trainer/TrainingGpu.js`

Gives a training run one graphics card.

## Methods

- `claim(recipe)` -> `{ cudaDevice, name, totalGb, freeGb, warning }`: the card with the
  most memory (ties to the lower index), recorded with `VramCoordinator.hold` under
  `lora-trainer` so other model servers route around it. `warning` is set when the card is
  smaller, or has less free memory, than the recipe's `minVramGb`; the run still starts.
- `release()`; static `strongest(cards)`, `warningFor(card, recipe)`.

## Notes

ai-toolkit trains on one device, so a second card does not add to the memory available.
A chat model resident on the chosen card is not unloaded by this class.

## Waiting for freed memory

`claim` reads the cards up to six times, 1.5 seconds apart, while the strongest card is
big enough for the recipe but looks too full. The image server is stopped just before,
and its memory shows as free a few seconds later: the first live run warned "only 2.9 GB
free" on a card that was empty by the time training began. A card that stays full is
still used, with the warning.

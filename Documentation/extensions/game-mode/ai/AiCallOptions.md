# AiCallOptions

`extensions/game-mode/ai/AiCallOptions.js`

The completion options of one in-game call: temperature (0-1.5, default 0.8), timeout (5-300 s, default 120 s), thinking off unless `think: true`, and the model (a body `modelRef`, else the conversation's pin; routes strip the body one).

## Methods

- `from(body, fallbackModelRef)`, `clampTemperature(t)`, `clampTimeout(t)`.

# ReactionProgress

`extensions/roleplay-mode/images/ReactionProgress.js`

Live feedback for one message's background image work.

## Methods

- `new ReactionProgress(emit, messageId, { phase, onSay })`: `phase()` names the
  reaction phase stamped on each label (`mode:progress { messageId, label,
  phase }`; left out when null), `onSay(label)` mirrors labels. `say(label)`, `done()`,
  `stage(stage, b64, mime)`, `feedback(label, stage)` (generateImage hooks).

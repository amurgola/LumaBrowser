# TriggerAdmission

`core/llm-server/chat/trigger-runner/TriggerAdmission.js`

The cheap decisions made before a real delivery costs a model turn, in order:

1. **Loop guard** (webhook triggers unless `source.botGuard === false`):
   `WebhookPresets.loopGuard(preset, body)`; a Slack or GitHub trigger must
   never answer its own or another bot's output.
2. **Filter**: `TriggerFilter.evaluate(source.filter, event)`, whose matchers
   run through `ExpectationMatcher`.
3. **Cooldown**: refuses events within `source.cooldownMs` of the later of the
   last accepted event (this process) and the stored `lastFiredAt`.

## Methods

- `new TriggerAdmission({ now? })`.
- `refusal(trigger, event)`: null, or `{ outcome, detail, reply }`:
  - `filtered` / `loop guard: <reason>` / `{ accepted: false, reason:
    'filtered', filtered: ['loop guard'], loopGuard }`
  - `filtered` / `filter did not match: <paths>` / `{ ..., filtered: [paths] }`
  - `cooldown` / `within cooldown, N s left` / `{ accepted: false, reason:
    'cooldown', retryAfterS }`
- `markAccepted(triggerId)`: starts the cooldown window.
- `TriggerAdmission.report(trigger, event)`: `{ filter?, cooldownMs?, batch? }`
  or null, so a setup test can say whether its sample would be filtered live.

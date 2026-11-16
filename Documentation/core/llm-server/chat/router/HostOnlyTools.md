# HostOnlyTools

`core/llm-server/chat/router/HostOnlyTools.js`

The tools only this computer's own user may put in a model's hands: today the `terminal_*` tools. A turn run for
someone else (a paired Network Sharing client, the web app, the local API) is not interactive, so nothing would ask
before a command ran in a terminal here. [ProxyTurns](ProxyTurns.md) passes `isHostOnly` as the run's `withholdTools`,
and `RunToolSet` then never allows, offers or lists those tools, whatever the host's allow-list says.

## Methods

- Static `isHostOnly(toolName)`. Static `PREFIXES`.

## Named tools

`HostOnlyTools.NAMES` holds the LoRA training tools (`train_lora`, `lora_training_status`,
`cancel_lora_training`, `apply_lora`): training reads folders on this computer, holds its
graphics card for hours and rewrites model manifests, so a turn run for someone else never gets them.

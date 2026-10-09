# PreflightIssues

`core/llm-server/ui/js/setup-ui/preflight/PreflightIssues.js`

The preflight banner's issue list: the boot issues from the main process plus one live row per GPU under VRAM pressure. Live rows survive a re-check of the boot list.

## Methods

- `setBoot(issues)`.
- `applyVramCard(card)`: a card shows while its band is low or critical and that band is not dismissed; returns true when shown. Invalid cards are ignored.
- `seedVram(cards)`: returns true when any card is live. `dismissVram(cardIndex)`.
- `all()`: boot issues, then VRAM issues sorted by card.

## Globals

None.

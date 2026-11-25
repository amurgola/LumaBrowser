# SummarySection

`extensions/personal-hub/ui/settings/SummarySection.js`

The Hub's summaries settings: switches the AI summaries of the activity
feed on or off, picks the model that writes them (the
`personal-hub.summarizer` slot; empty means the app's active provider),
shows what the summariser last did, and can write every card again on
demand. See [ActivitySummarizer](../../summary/ActivitySummarizer.md) for
what the cards are. Shown in Settings > Hub and in the Dashboard's settings
panel ([HubSettingsPanel](../widgets/HubSettingsPanel.md)), so it imports
nothing outside the extension's ui folder (see [HubSection](HubSection.md))
and reaches the main process only through its host's `invoke`.

## Behaviour

- `Write summaries with a model` (a checkbox): `setSummariesEnabled(checked)`,
  with the notice `Summaries are on.` or `Summaries are off.`. Off, the
  cards still show, filled in by rules.
- `Let the model ask for more from the source` (a checkbox, off by
  default): `setSummarySources(checked)`, with the notice `The model may
  ask for more from the source.` or `The model works from the
  notifications alone.`. The help under it says what it does: the model
  can ask the Hub to open what it cannot judge (a chat conversation, a
  mail) in the signed-in session it came from and read it, a few per
  card, in a hidden tab, and that opening a mail marks it as read. It
  shows `status.sources`.
- `Model` (a select): `Use the active provider (default)`, then every
  available model, its value `<providerId>::<modelId>`. The list and the
  current pick come from the main process (`listSummaryModels` ->
  `{ models: [{ value, label, unavailable? }], chosen }`), so the picker works wherever
  the section is shown; the chosen model is selected when it is in the
  list, else the default. A saved model that is gone (`unavailable`) is a
  disabled option, `Unavailable: <model>`: shown because it is the saved
  one, not a choice to make again. Changing it calls `setSummaryModel(value)` (the
  empty value for the default), with the notice `Summary model saved.`. A
  failed read of the models leaves only the default.
- `Summarise now`: `summarizeNow({ force: true })`, which writes every card
  again (whether or not summaries are switched on); the button is disabled
  meanwhile, and when there is no LLM service or a pass is already running.
  Cards that failed are reported as an error (`2 cards could not be written;
  see the status line.`), else `Summaries written.`. After a failed pass
  (cards that failed, or a call that could not be made) the section is
  loaded again, so the status line names the error (`Last attempt failed:
  <error>`) and the button is usable again.
- The status line (`statusText(status)`): `No language model service is
  available to the Hub.`, or the model (`Using <model>.`, or `No model is
  set up yet: pick one above, or set a provider in Settings.`) followed by
  one of `Writing summaries now.`, `Last attempt failed: <error>`,
  `Summaries are off: cards are filled in by rules.`, `Last written <time>.`
  or `Cards are written as activity arrives.`.

## Methods

- `new SummarySection(tab)` (see [HubSection](HubSection.md)).
- `DEFAULT_OPTION` (static): the `Use the active provider (default)` option.
- `static statusText(status)`.

## IPC

`summaryStatus`, `listSummaryModels`, `setSummaryModel(value)`,
`setSummariesEnabled(enabled)`, `setSummarySources(on)`,
`summarizeNow({ force })`.

## Why

The model list and the pick go through the section's own channels rather
than a global of the settings page, so the same picker works on the
Dashboard too: `invoke` is all the section needs from whatever shows it.

The model is a slot of its own so the user can leave a small local model
writing the cards while the chat uses something larger; a local model keeps
the notifications on this computer.

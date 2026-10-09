# rp-lab.js (classic)

`extensions/roleplay-mode/rp-lab.js`

The Roleplay Lab (dev): a Setup tab that runs the real roleplay image pipeline
for a seeded scenario and lets you tune and regenerate single steps.
Classic-script exception (distributable extension): one self-contained classic
file, loaded by the LLM tab's Setup host from the manifest's `chatUi.assets`
and registered only when [RoleplayExtension](RoleplayExtension.md) adds the
`roleplay-lab` Setup tab (the "Enable Roleplay Lab" flag).

## What it does

Calls `window.LumaSetupExt.registerTab({ id: 'roleplay-lab', label: 'Roleplay
Lab', mount })`. `mount(pane)` builds the `#rpLabRoot` scaffold (title, Run
pipeline button, body) and opens the Lab: injects its `#rplab-styles` CSS,
loads `rpLab.getScenario()` (scenario and production `imageProfiles`, with
built-in fallbacks), and adds the production console (Fast / Balanced /
Quality profiles, recipe chips, run switches, relighting mode and strength),
the emotion select, the dimension matrix and a status line.

- Run: `rpLab.run({ overrides, options })`; live `lab:step`,
  `mode:image-stage`, `mode:image`, `lab:comparison`, `mode:image-fail` and
  `mode:progress` events from `rpLab.onEvent` render step cards as they come.
- Each step card shows the image, inputs, an editable prompt and the params
  (steps, sampler, scheduler, strength, cfgScale, seed; numbers clamped);
  edits become per-step overrides. "Regenerate" calls
  `rpLab.regenerateStep({ stepKey, overrides })`; "Regenerate from here" calls
  `rpLab.regenerateFrom({ fromKey, overrides, options })`.

Backend text reaches `innerHTML` through `esc` (text positions).

## Globals

Reads `window.LumaSetupExt`, `window.llmDiagAPI.rpLab`. Writes none.

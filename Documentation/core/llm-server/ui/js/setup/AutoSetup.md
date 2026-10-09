# AutoSetup

`core/llm-server/ui/js/setup/AutoSetup.js`

The full Automatic Local Setup [pipeline](SetupPipeline.md), from a planner plan.

## Methods

- `AutoSetup.run(apis, opts)`. `apis`: `{ llm, image?, music?, placement?, system? }`
  (llm also `setEnabled`, `setOpenTabOnLoad`; image also `getRuntimesView`,
  `modelCatalog`; placement `setConfig`; system `checkSystemLibraries`, else
  `llm` is asked). `opts`: `{ plan, resumeFrom?: 'image' | 'music', priorFile?,
  ...hooks }`.
  0. "Checking your system…": [SystemLibraries](SystemLibraries.md). A missing
     library stops BEFORE any download: `{ ok: false, sysdeps, failedStep:
     'system', message }`.
  1. A singularity plan writes its placement layout first, so the first server
     launch already reserves the planned card (a failed write is ignored).
  2. LLM leg ([LlmSetup](LlmSetup.md)), then enables the tab and boot-into-tab.
     A failure returns `{ ...result, failedStep: 'llm' }`. With `resumeFrom` the
     leg is skipped and `priorFile` echoed.
  3. Image leg (when the plan has one and `resumeFrom` is not `music`): picks the
     runtime ([ImageRuntimePicker](ImageRuntimePicker.md)) and model (or the
     plan's linked `found` checkpoint), runs [ImageSetup](ImageSetup.md). In a
     singularity a successful image start evicted the chat model, so it
     optionally pins both in RAM ([RamPin](RamPin.md), when `plan.ramPin.recommended`)
     and restarts the LLM server. A failure is reported, never rolled back.
  4. Music leg ([MusicSetup](MusicSetup.md)), same rules, no server start.
  Resolves `{ ok: true, file, destPath, image, music }` (`image`/`music` are the
  leg results or `null`). Fallback message: "Automatic setup failed".

Progress is one bar for the whole plan; see
[AutoSetupProgress](AutoSetupProgress.md).

## Globals

None.

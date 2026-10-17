# LocalModelPick

`tools/docs/readme-shots/LocalModelPick.js`

Chooses the local model the screenshot chat runs on. The README shows a model running on the owner's machine, so
cloud providers in the seed are ignored even when Settings names one as the default LLM.

`choose(page, prefer)` reads `window.llmDiagAPI.listModels()` on the LLM tab, keeps the refs starting with
`local::`, and takes the first whose ref, name, label or display name contains `prefer` (case insensitive), else
the listed `defaultRef` when that is local, else the first local model. It then calls `setLastModelRef(ref)` so
the landing line, the model pill and the turn agree, and returns `{ ref, label }`. With no local model at all (or
none matching `prefer`) it throws with the counts, pointing at LLM Setup.

## Methods

- `static choose(page, prefer = null)`: `Promise<{ ref, label }>`.

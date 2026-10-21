# LlmModelRow

`core/llm-server/ui/js/setup-ui/models/LlmModelRow.js`

Builds the shared model-list row view (the mlRow contract) for one LLM scan model: header tags, the facts strip, path, the companion notes, sidecar and runtime tags, the shard list, the context-fit matrix and the fit-test block.

## Methods

- `new LlmModelRow({ recommender, ctxFit, fitBlock })`; `view(m)`; statics `weightsPath(m)`, `nameKey(m)`, `factsHtml(m)`, `sidecarTags(m)`, `roleBadge(m)`, `notesHtml(m)`, `unpairedHtml(m)`, `pairingHtml(m)`. Every interpolated value is escaped (a stored display name with quotes cannot break out of `data-cur`, bug C1; a hostile companion file name cannot inject markup into a note).

## What the scanner's classification looks like on a row

- **Role badge** (`roleBadge`): a `.luma-badge` in the header tags, after the architecture chip, for every `model.role` other than `main`: `draft`, `embedding`, `reranker`, `projector` (mmproj) and `MTP head` (mtp), per `ROLE_LABELS`. It carries `data-role` and `data-role-source`; the tooltip is the scanner's `roleReason`. When `roleSource` is `filename` the badge takes the outlined `muted` variant and the tooltip says the role was taken from the file name, not the GGUF header, because the header could not be read or did not say.
- **Unpaired note** (`unpairedHtml`): a `.model-note[data-unpaired=N]` under the facts on a model whose `unpairedCompanions` is non-empty: "Not attached: projector `file`, drafter `file`. More than one model in this folder could claim them; rename a file after the model it belongs to, or move it into that model's own folder, to attach it." Kind labels come from `COMPANION_LABELS` (`mmproj`, `drafter`, `mtp`).
- **Pairing line** (`pairingHtml`): a `.model-note[data-pairing=status]` on a standalone companion entry (an mmproj-only or mtp-only entry, or a lone draft-role weights entry) whose `pairing.status` is not `paired`: "Listed on its own: {the pairer's reason} (candidate stems)." The wording is the `GgufCompanionPairer` verdict, never a new state. With a verdict present the `mmproj-only` / `mtp-only` sidecar tag drops its old "(no main weights in this dir)" suffix.
- **Chat template** (`factsHtml`): `no chat template` joins the facts strip when `model.gguf.hasChatTemplate === false` and the role is one that would use a template (not embedding, reranker, mmproj or mtp). A present template is the norm and gets no fact.

## Globals

None.

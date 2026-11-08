# LlmModelRow

`core/llm-server/ui/js/setup-ui/models/LlmModelRow.js`

Builds the shared model-list row view (the mlRow contract) for one LLM scan model: header tags, the facts strip, path, the companion notes, sidecar and runtime tags, the shard list, the context-fit matrix and the fit-test block.

## Methods

- `new LlmModelRow({ recommender, ctxFit, fitBlock })`; `view(m)`; statics `weightsPath(m)`, `nameKey(m)`, `factsHtml(m)`, `sidecarTags(m)`, `roleBadge(m)`, `notesHtml(m)`, `unpairedHtml(m)`, `pairingHtml(m)`, `drafterOfferHtml(m)`, `actionsHtml(m)`, `drafterMissingHtml(m)`. Every interpolated value is escaped (a stored display name with quotes cannot break out of `data-cur`, bug C1; a hostile companion file name cannot inject markup into a note).

## What the scanner's classification looks like on a row

- **Role badge** (`roleBadge`): a `.luma-badge` in the header tags, after the architecture chip, for every `model.role` other than `main`: `draft`, `embedding`, `reranker`, `projector` (mmproj) and `MTP head` (mtp), per `ROLE_LABELS`. It carries `data-role` and `data-role-source`; the tooltip is the scanner's `roleReason`. When `roleSource` is `filename` the badge takes the outlined `muted` variant and the tooltip says the role was taken from the file name, not the GGUF header, because the header could not be read or did not say.
- **Unpaired note** (`unpairedHtml`): a `.model-note[data-unpaired=N]` under the facts on a model whose `unpairedCompanions` is non-empty: "Not attached: projector `file`, drafter `file`. More than one model in this folder could claim them; rename a file after the model it belongs to, or move it into that model's own folder, to attach it." Kind labels come from `COMPANION_LABELS` (`mmproj`, `drafter`, `mtp`).
- **Pairing line** (`pairingHtml`): a `.model-note[data-pairing=status]` on a standalone companion entry (an mmproj-only or mtp-only entry, or a lone draft-role weights entry) whose `pairing.status` is not `paired`: "Listed on its own: {the pairer's reason} (candidate stems)." The wording is the `GgufCompanionPairer` verdict, never a new state. With a verdict present the `mmproj-only` / `mtp-only` sidecar tag drops its old "(no main weights in this dir)" suffix.
- **Drafter tag and offer**: an attached drafter (`m.drafter`) is a `drafter · size` sidecar tag whose tooltip lists the files with their header block size. A model the catalog knows (`m.drafterOffer`, from [LlmModelsView](../../../../ipc/LlmModelsView.md)) and that has no drafter yet gets a `.model-note.model-drafter-offer[data-drafter-offer=id]` under the facts (`drafterOfferHtml`): "Speculative drafter available: DFlash2 for Qwen3.8-27B (repo, size). <blurb>" and a `Download drafter` button (`data-ml-act="drafter-download"`, `data-key`, `data-drafter-id`, `data-model-path`; the license note as tooltip) that [DrafterDownloads](DrafterDownloads.md) handles. When `engineSupported` is false the button is replaced by "Needs a llama.cpp runtime."
- **MTP badge**: `mtpBadge(m)` shows `MTP` only when MTP will run (`speculationOf(m)`: the scan's `speculation`, else the drafter, else the head). A head left idle shows a muted `MTP unused` badge whose tooltip says why (a drafter file runs instead, or speculation is off under Drafter).
- **Drafter button and choice**: every plain GGUF main model gets a `Drafter` action (`data-ml-act="drafter"`, the twin of the image rows' `LoRAs / speed`) that opens [DrafterModal](DrafterModal.md). The tag reads `drafter (chosen)` for a swapped file and `drafter off` when switched off; a chosen file that is gone (`m.drafterChoiceMissing`) gets a `[data-drafter-missing]` note.
- **Chat template** (`factsHtml`): `no chat template` joins the facts strip when `model.gguf.hasChatTemplate === false` and the role is one that would use a template (not embedding, reranker, mmproj or mtp). A present template is the norm and gets no fact.

## Globals

None.

# LoraInspector

`core/image-server/models/LoraInspector.js`

Checks that a `.safetensors` file really is a LoRA-style adapter (not a full
checkpoint) and which base model family it was trained against, so the import
and attach UI can warn before a mismatched LoRA renders garbage. Only the header
is read, so a multi-GB file is instant.

## Methods

- `LoraInspector.inspect(filePath)` never throws. Returns
  `{ ok: false, error }` for an unreadable or non-safetensors file, else
  `{ ok: true, isLora, form, base, families, source, keyCount, needsFusedMlpRepack }`:
  - `form`: `'lora'` (up/down or PEFT A/B), `'lokr'`, `'loha'`, `'diff'`, or `null`.
  - `base`: `{ id, label }`, `{ id: null, label: <metadata string> }` for an
    unknown trainer base, or `null`.
  - `families`: catalog family strings from [LoraBaseDetector](LoraBaseDetector.md); `[]` when unknown.
  - `source`: `'metadata'`, `'keys'` or `null`.
  - `needsFusedMlpRepack`: a diffusers-form Qwen-Image 2.1 LoRA that still
    needs [LoraRepacker](LoraRepacker.md) aliases; false once repacked.
- `LoraInspector.FORM_MARKERS`.

## Why

Trainer metadata is authoritative, most specific first:
`ss_base_model_version` (kohya, ai-toolkit), `modelspec.architecture`, then the
loose `base_model` some bespoke trainers write (the MiniMax-H3 Turbo LoRA).
Tensor-key fingerprints are the fallback. Detection informs; it never blocks
an import.

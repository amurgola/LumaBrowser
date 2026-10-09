# ModelNameToken

`core/llm-server/models/ModelNameToken.js`

Rules for one `-`/space separated token of a model file stem, used by
[ModelName](ModelName.md)`.prettify`.

## Methods

- `ModelNameToken.isNoise(token)` is true for identity-free tokens: quants
  (`Q4_K_M`, `IQ4_XS`), formats (`FP16`, `MXFP4`, `F16`, `BF16`, `F32`), `INT4`/`INT8`,
  `GGUF`/`GGML`, and `instruct`, `chat`, `it`, `base`, `hf`, `sft`, `dpo`.
- `ModelNameToken.isQuantOrFormat(token)` is the quant and format subset.
- `ModelNameToken.style(token)`:
  - sizes upper-case their multiplier (`7b` -> `7B`, `1.5b` -> `1.5B`);
  - a run of 3+ letters glued to a version splits (`Qwen2.5` -> `Qwen 2.5`), so
    short revision tags (`R1`, `v0`, `K2`) stay intact;
  - an all-lowercase word becomes an acronym from `ACRONYMS` (`oss` -> `OSS`,
    `moe` -> `MoE`) or Title Case;
  - anything with a capital or digit is left as authored (`DeepSeek`, `A4B`).

## Why

Tokens are split on `-` and whitespace only, so quant tokens with underscores
survive intact and match the noise patterns.

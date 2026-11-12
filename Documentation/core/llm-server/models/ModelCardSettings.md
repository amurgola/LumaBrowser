# ModelCardSettings

`core/llm-server/models/ModelCardSettings.js`

Finds the sampler settings recommended for a model on the Hub.

`find(repoId, { client, signal, maxRepos })` asks, in each repo, the model
card first and `generation_config.json` second; the first source that
recommends anything is the answer, taken whole. A repo that says nothing is
followed to its `base_model` only when it is a repackaging of it
(`ModelCardSampler.isRepackaging`), at most `MAX_REPOS` (4) repos: a GGUF repo
leads to its source, a fine-tune never leads to what it was tuned from (a
roleplay tune of Mistral Small would otherwise get Mistral's 0.15).

Resolves `{ settings, source: { kind, repoId }, text }` or `null`. Never
throws; an unreachable Hub is "nothing found", and the app's defaults stand.

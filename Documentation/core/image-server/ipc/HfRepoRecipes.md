# HfRepoRecipes

`core/image-server/ipc/HfRepoRecipes.js`

Turns a pasted HuggingFace model page URL into a known multi-file download recipe (today: Anima).

## Methods

- `HfRepoRecipes.parseRepoUrl(url)` `{ id: 'owner/name' }` for a huggingface.co model page; null otherwise, including `/resolve/` and `/blob/` file URLs.
- `resolve(repoId, rfilenames, catalog)` the Anima recipe for `circlestone-labs/Anima` or any repo with `anima-*.safetensors`; otherwise `{ error }` pointing at the single-file import.
- `resolveAnima(repoId, rfilenames, catalog)` the newest base under `diffusion_models/`, a (preferably qwen) text encoder under `text_encoders/`, a (preferably qwen vae) VAE under `vae/`; returns `{ entry }` with id `anima`, the curated row's label, family, defaults, licence and runtimes (fallbacks when absent), `--diffusion-model` on the diffusion file and a `resolvedNote`, or a named-missing-piece error.
- `pickNewestAnimaBase(files)` tagged `anima-base-vX.Y` by descending version, else descending name.
- `resolveUrl(repoId, rfilename)` the `/resolve/main/` URL with each segment encoded, `?download=true`.

## Why

The download lands under the curated `anima` id so the scanner reconciles label, family and defaults from the catalog row, and a future v1.1 base wins automatically.

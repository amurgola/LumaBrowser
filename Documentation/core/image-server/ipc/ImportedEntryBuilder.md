# ImportedEntryBuilder

`core/image-server/ipc/ImportedEntryBuilder.js`

Synthesises a catalog-shaped entry for a custom checkpoint (a URL, a local file or a found library file).

## Methods

- `ImportedEntryBuilder.build({ name, url?, srcPath?, baseType, approxBytes?, loaderFlag?, kind?, promptStyle? })` returns `{ entry }` or `{ error }`. Errors: `A display name is required.`, `baseType must be one of: <bases>`, `Either a URL or a local file path is required.`, `Could not infer a filename from the URL. ...`, and the Flux single-file `.safetensors` refusal.
  The entry: `id` (sanitized name), trimmed `label`, base family, `kind` (`edit` / `generate` request wins, else the base's), `supportsEdit` / `constraints` from the base, `imported`, `baseType`, `promptStyle` (chosen, else `ImagePromptProfiles.DEFAULT_PROFILE_BY_BASE`), `files.diffusion { role, file, loaderFlag, url?, approxBytes? }`, defaults = base defaults + `profileDefaultsPatch(profile)`, minVramBytes, launchArgs, licenseNote, protocol `sd-cpp-http`, the three sd.cpp runtimes.
- `sanitizeId(name)` lowercase `[a-z0-9_.-]`, other runs to `-`, edge dashes and dots trimmed, 80 chars; empty, pure dots and Windows-reserved names become `custom-model`.
- `filenameFromUrl(url)` the decoded last path segment, or null.
- `loaderFlag(baseType, requested, ext)` split-diffusion bases `--diffusion-model`; else a valid request (`-m` / `--diffusion-model`); else `.gguf` -> `--diffusion-model`, anything else `-m`.

## Why

A sanitized id can never escape the models directory through `path.join`. Qwen and Anima files are UNet-only, so `-m` (all-in-one) cannot load them.

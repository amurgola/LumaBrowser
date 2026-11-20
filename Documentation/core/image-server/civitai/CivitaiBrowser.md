# CivitaiBrowser

`core/image-server/civitai/CivitaiBrowser.js`

The image setup card's window onto CivitAI: searches and lists models as renderer rows, reads one model's detail before an install, and owns the CivitAI settings (API key, adult content). Pages and details are remembered for `CACHE_TTL_MS` (5 minutes, CivitAI's own public cache window) in [PromiseTtlCache](../../shared/cache/PromiseTtlCache.md) instances, so paging back or hovering then clicking costs one request. Installs go through [ImageModelImporter](../ipc/ImageModelImporter.md)`.fromCivitai` (checkpoints) and [CivitaiLoraInstaller](../ipc/CivitaiLoraInstaller.md) (LoRAs).

## Methods

- `new CivitaiBrowser({ client?, imageServerService, now? })`; `client` a [CivitaiClient](CivitaiClient.md).
- `CivitaiBrowser.filters({ lora?, family? })` `{ bases: [{ id, label }], sorts, periods, types }` for the card's controls. `types` are `Checkpoint` and `LORA`. `BASE_FILTERS` groups CivitAI base names: `importable` (the default), `illustrious`, `pony`, `sdxl`, `sd15`, `flux`, `qwen`, `anima`, `video` (browse only for checkpoints, plain "Video" for LoRAs), `any`. For a LoRA search with a `family` CivitAI has bases for, a `family` choice ("Fits this model") comes first.
- `search({ query?, types?, base?, family?, sort?, period?, nsfw?, cursor?, limit? })` resolves `{ items, nextCursor, filters }` with [CivitaiSearchView](CivitaiSearchView.md) rows. Defaults: checkpoints, the `importable` group, `Most Downloaded`, 24 per page, `primaryFileOnly`, and the saved adult-content setting unless `nsfw` is given. Remembered per resolved filter set.
- A LoRA search (`types` holding `LORA`) asks CivitAI for `LORA_TYPES` (`LORA` and `LoCon`, where CivitAI files LyCORIS adapters). Its `importable` group is every base [CivitaiLoraBaseMap](CivitaiLoraBaseMap.md) maps to a model family, wider than the checkpoint import bases, and `base: 'family'` with `family` lists the bases whose LoRAs fit that family (falling back to `importable` when there are none). DoRAs are left out of the listing because the runtime cannot apply them; a pasted DoRA URL still previews with that reason.
- `preview({ url?, modelId?, versionId?, fileId? })` `{ preview }` (a `CivitaiSearchView.detail`: every version, the selected one's install facts, sample images and the page as Markdown, also for versions that cannot be installed) or `{ success: false, error }` (`URL_HINT` for junk, `has no published versions`, or the API failure). A version id alone is resolved through `getVersion`. Remembered per model, version and file.
- `getSettings()` `{ hasToken, tokenSource: 'settings' | 'env' | null, nsfw }`; the key itself never leaves the main process.
- `setSettings({ token?, nsfw? })` saves through the service ([ImageServerSettings](../service/ImageServerSettings.md)), applies the key to [CivitaiAuth](../../shared/download/CivitaiAuth.md) at once, and forgets the remembered pages and details (a key can unlock gated listings).

## Why

The renderer gets stable rows and verdicts instead of CivitAI JSON, the key is write-only from the UI, and the base groups keep a listing to what the app can actually install unless the user widens it on purpose. The detail is read directly rather than through the resolver so a LoRA or an unsupported base still shows its page with the reason.

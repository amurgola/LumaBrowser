# CivitaiLoraInstaller

`core/image-server/ipc/CivitaiLoraInstaller.js`

Installs a LoRA from CivitAI into the shared LoRA library ([ImageLoraLibrary](ImageLoraLibrary.md)) and files it under the LoRA base it is for, so the LoRA dialog offers it to the image models of the families it fits. Behind the `core.imageServer.importLoraFromCivitai` channel.

## Methods

- `new CivitaiLoraInstaller({ library, slot, resolver? })`: the library, the shared [ImageDownloadSlot](ImageDownloadSlot.md), and a [CivitaiLoraResolver](../civitai/CivitaiLoraResolver.md).
- `install({ url?, modelId?, versionId?, fileId? }, send)` resolves `{ success: true, lora, alreadyInstalled?, baseNote? }` where `lora` is the library row (`name`, `file`, `bytes`, `base`, `families`, `form`, `label`, `trigger`, `listing`), or `{ success: false, error }`. Progress rides the model-event stream as `start` (`id: civitai-lora-<versionId>`), `file-start`, `download`, `file-done`, `done`; a throw is sent as `error`.

## Flow

1. The resolver reads the listing; its refusal (not a LoRA, a DoRA, a base without a family, no `.safetensors` file) ends the install before a byte is fetched.
2. The file name is the listing's. When the library already holds that name for the same version and file, the row is answered with `alreadyInstalled` and nothing is downloaded. When a different LoRA holds the name, the new one becomes `<name>-<versionId>.safetensors`.
3. The download carries the listing's size and sha256, so a truncated or swapped file is refused by the verifier.
4. The file's own header is read (`ImageLoraLibrary.headerBase`) and the base is settled: the listing's base stands unless the weights fit none of the families it claims, in which case the header's base is recorded and `baseNote` says so.
5. `ImageLoraLibrary.adopt` refuses and deletes anything that is not a LoRA, repacks Qwen-Image 2.1 adapters, and writes the sidecar.

## Why

- The listing names the base because it can tell what a header cannot: Pony from plain SDXL, SD 1.5 from an ambiguous UNet LoRA. The header overrules it only on a real contradiction (a file listed as SDXL whose tensors are FLUX), which is a wrong listing, not a finer one.
- It shares the one download slot with models and curated LoRAs, so a LoRA never races a multi-GB model for disk and bandwidth, and the same Cancel reaches it.

# TrainerImageHost

`extensions/lora-trainer/TrainerImageHost.js`

The one place the add-on touches the app's image side and chat.

## Methods

- `installedModels()`: records from ImageModelsScanner over the image models folder.
- `defaultGenerateModelId()`.
- `listLoras()`, `importLora(filePath, meta)`: [ImageLoraLibrary](../../core/image-server/ipc/ImageLoraLibrary.md).
- `setModelLoras(modelId, loras, preset = null)`: ModelLoraAttacher.
- `stopImageServers()`: ImageSlots `stopAll`, best effort.
- `artifact(id)`: a chat artifact from the chat router's artifact store.

Services are looked up through ExtensionGlobals on every call, since the image server
does not exist yet when extensions activate at boot.

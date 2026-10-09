const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('extensionEditorAPI', Object.freeze({
  listFiles: () => ipcRenderer.invoke('core.shell.listExtensionFiles'),
  readFile: (fileName) => ipcRenderer.invoke('core.shell.readExtensionFile', String(fileName)),
  writeFile: (fileName, content) => ipcRenderer.invoke('core.shell.writeExtensionFile', String(fileName), String(content)),
  autocompleteData: () => ipcRenderer.invoke('core.shell.getExtensionAutocompleteData'),
}));

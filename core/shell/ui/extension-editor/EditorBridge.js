export default class EditorBridge {
  constructor(api) {
    this._api = api;
  }

  static fromWindow(win) {
    if (!win.extensionEditorAPI) throw new Error('extensionEditorAPI is missing: the editor must load with its preload');
    return new EditorBridge(win.extensionEditorAPI);
  }

  listFiles() {
    return this._api.listFiles();
  }

  readFile(fileName) {
    return this._api.readFile(fileName);
  }

  writeFile(fileName, content) {
    return this._api.writeFile(fileName, content);
  }

  autocompleteData() {
    return this._api.autocompleteData();
  }
}

import CompletionProvider from './completions/CompletionProvider.js';
import EditorMonaco from './EditorMonaco.js';

export default class EditorFiles {
  constructor({ monaco, editor, bridge, extensionDir }) {
    this._monaco = monaco;
    this._editor = editor;
    this._bridge = bridge;
    this._dir = extensionDir;
    this._models = new Map();
    this.currentFile = null;
  }

  async open(fileName) {
    const content = await this._bridge.readFile(fileName);
    const filePath = this._dir + '/' + fileName;
    let model = this._models.get(filePath);
    if (!model) {
      model = this._monaco.editor.createModel(content, EditorMonaco.languageFor(fileName), this._monaco.Uri.file(filePath));
      this._models.set(filePath, model);
    }
    this._editor.setModel(model);
    this.currentFile = filePath;
  }

  async saveCurrent() {
    if (!this.currentFile) return null;
    const fileName = CompletionProvider.fileNameOf(this.currentFile);
    await this._bridge.writeFile(fileName, this._editor.getValue());
    return fileName;
  }

  async saveAll() {
    let saved = 0;
    for (const [filePath, model] of this._models) {
      const fileName = CompletionProvider.fileNameOf(filePath);
      try {
        await this._bridge.writeFile(fileName, model.getValue());
        saved++;
      } catch (e) {
        console.error('Failed to save', fileName, e);
      }
    }
    return saved;
  }
}

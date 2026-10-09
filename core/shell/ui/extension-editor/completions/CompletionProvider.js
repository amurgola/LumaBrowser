import ContextPropertyCompletions from './ContextPropertyCompletions.js';
import CssClassCompletions from './CssClassCompletions.js';
import DependencyShortcutCompletions from './DependencyShortcutCompletions.js';
import ExtensionApiCompletions from './ExtensionApiCompletions.js';
import RendererContextCompletions from './RendererContextCompletions.js';
import ServiceMethodCompletions from './ServiceMethodCompletions.js';
import SlotNameCompletions from './SlotNameCompletions.js';

export default class CompletionProvider {
  static TRIGGER_CHARACTERS = ['.', '(', '"', "'", '/', 'c'];

  constructor(monaco, { data, extensionId, currentFile }) {
    this._monaco = monaco;
    this._data = data;
    this._extensionId = extensionId;
    this._currentFile = currentFile;
    this._sources = [
      new ContextPropertyCompletions(),
      new ExtensionApiCompletions(),
      new ServiceMethodCompletions(),
      new DependencyShortcutCompletions(),
      new CssClassCompletions(),
      new RendererContextCompletions(),
      new SlotNameCompletions(),
    ];
  }

  register() {
    return this._monaco.languages.registerCompletionItemProvider('javascript', {
      triggerCharacters: CompletionProvider.TRIGGER_CHARACTERS,
      provideCompletionItems: (model, position) => this.provide(model, position),
    });
  }

  provide(model, position) {
    const ctx = this._context(model, position);
    return { suggestions: this._sources.flatMap((source) => source.suggest(ctx)) };
  }

  static fileNameOf(filePath) {
    return filePath ? filePath.split('/').pop().split('\\').pop() : '';
  }

  _context(model, position) {
    const text = model.getValueInRange({
      startLineNumber: position.lineNumber,
      startColumn: 1,
      endLineNumber: position.lineNumber,
      endColumn: position.column,
    });
    return {
      text,
      fileName: CompletionProvider.fileNameOf(this._currentFile()),
      position,
      data: this._data,
      extensionId: this._extensionId,
      monaco: this._monaco,
    };
  }
}

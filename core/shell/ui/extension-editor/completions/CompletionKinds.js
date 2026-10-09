export default class CompletionKinds {
  static NAMES = {
    1: 'Text', 2: 'Method', 3: 'Function', 4: 'Class', 5: 'Value', 6: 'Interface', 7: 'Property', 8: 'Field',
    11: 'Variable', 14: 'Keyword', 18: 'Constant', 20: 'EnumMember', 22: 'File', 25: 'Unit', 27: 'Color',
  };

  static map(monaco, kind) {
    const kinds = monaco.languages.CompletionItemKind;
    const name = Object.prototype.hasOwnProperty.call(CompletionKinds.NAMES, kind) ? CompletionKinds.NAMES[kind] : null;
    return name ? kinds[name] : kinds.Property;
  }
}

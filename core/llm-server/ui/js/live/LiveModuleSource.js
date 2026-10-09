export default class LiveModuleSource {
  static declaresOwnName(js, name) {
    return new RegExp('\\b(?:let|const|var|function|class)\\s+' + name + '\\b').test(String(js || ''));
  }

  static declaresOwnStore(js) {
    return LiveModuleSource.declaresOwnName(js, 'store');
  }
}

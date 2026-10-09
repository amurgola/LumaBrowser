export default class EditorContext {
  static MAX_SELECTION_CHARS = 24000;
  static MAX_FILE_CHARS = 48000;

  static fromEditor(editor, path, entry) {
    if (!entry || entry.image || !editor) return null;
    const sel = editor.getSelection();
    if (!sel || sel.isEmpty()) return EditorContext._file(path, entry.model.getValue());
    const endLine = sel.endColumn === 1 && sel.endLineNumber > sel.startLineNumber ? sel.endLineNumber - 1 : sel.endLineNumber;
    return {
      kind: 'selection', path, startLine: sel.startLineNumber, endLine,
      text: entry.model.getValueInRange(sel).slice(0, EditorContext.MAX_SELECTION_CHARS),
    };
  }

  static async fromPath(path, openFiles, client) {
    const open = openFiles.get(path);
    if (open) return open.image ? null : EditorContext._file(path, open.model.getValue());
    const r = await client.call('read', { path });
    if (!r || !r.success || r.image) return null;
    return EditorContext._file(path, String(r.content || ''));
  }

  static _file(path, text) {
    return { kind: 'file', path, text: text.slice(0, EditorContext.MAX_FILE_CHARS) };
  }
}

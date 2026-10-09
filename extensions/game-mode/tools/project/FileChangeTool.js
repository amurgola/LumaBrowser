const ProjectTool = require('./ProjectTool');
const GameSnapshot = require('../../session/GameSnapshot');
const WriteNotes = require('./WriteNotes');

class FileChangeTool extends ProjectTool {
  get sandboxed() { return true; }

  _recordChange(s, relPath, ok, emit) {
    s.files.set(relPath, { ok, phase: 'done' });
    if (s.readWhole) s.readWhole.delete(relPath);
    GameSnapshot.emit(emit, s);
  }

  static _notes(s, relPath, content) {
    const apiNote = WriteNotes.phaserApi(s.dir, relPath, content);
    return { apiNote, text: apiNote + WriteNotes.indexWiring(s.dir, relPath) };
  }
}

module.exports = FileChangeTool;

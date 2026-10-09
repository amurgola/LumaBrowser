const path = require('path');
const CodeValidator = require('../../llm-server/validation/CodeValidator');
const ToolPresentation = require('../../llm-server/chat/ToolPresentation');
const FileEdit = require('../FileEdit');
const FileMutationQueue = require('../FileMutationQueue');
const WorkspacePaths = require('./WorkspacePaths');

class WorkspaceMutations {
  constructor({ fsOps, guard }) {
    this._fs = fsOps;
    this._guard = guard;
    this._queue = new FileMutationQueue();
  }

  static validate(relPath, content) {
    return CodeValidator.validate({ filename: relPath, content: WorkspaceMutations._text(content) });
  }

  async writeText(dir, relPath, content) {
    const target = WorkspacePaths.resolve(dir, relPath);
    const text = WorkspaceMutations._text(content);
    return this._queue.run(target, async () => {
      const rel = WorkspacePaths.relative(dir, target);
      const refusal = this._guard.refusal(target, relPath, 'Write');
      if (refusal) return { ok: false, path: rel, error: refusal.error, code: refusal.code };
      const validation = await WorkspaceMutations.validate(relPath, text);
      const priorText = this._readOrNull(target);
      this._writeFile(target, text, 'utf8');
      this._guard.observe(target, text);
      return ToolPresentation.withDiffBasis(WorkspaceMutations._writeResult(rel, text, validation), priorText, text);
    });
  }

  async writeBytes(dir, relPath, bytes, { overwrite = false } = {}) {
    const target = WorkspacePaths.resolve(dir, relPath);
    const buffer = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes == null ? '' : bytes);
    return this._queue.run(target, async () => {
      const rel = WorkspacePaths.relative(dir, target);
      const existing = this._guard.stat(target);
      const refusal = WorkspaceMutations._bytesRefusal(existing, overwrite, rel);
      if (refusal) return refusal;
      this._writeFile(target, buffer);
      this._guard.observe(target);
      return { ok: true, path: rel, bytes: buffer.length, created: !existing };
    });
  }

  edit(dir, relPath, edits) {
    const target = WorkspacePaths.resolve(dir, relPath);
    return this._queue.run(target, async () => {
      const rel = WorkspacePaths.relative(dir, target);
      const current = this._readOrNull(target);
      if (current === null) return { ok: false, path: rel, error: `File not found: ${relPath}. Use write to create it.` };
      const refusal = this._guard.refusal(target, relPath, 'Edit');
      if (refusal) return { ok: false, path: rel, error: refusal.error, code: refusal.code };
      const edited = FileEdit.apply(current, edits);
      if (!edited.ok) return { ok: false, path: rel, error: edited.error };
      this._fs.writeFileSync(target, edited.content, 'utf8');
      this._guard.observe(target, edited.content);
      const validation = await WorkspaceMutations.validate(relPath, edited.content);
      return ToolPresentation.withDiffBasis(WorkspaceMutations._editResult(rel, edited, validation), current, edited.content);
    });
  }

  _readOrNull(target) {
    try {
      return this._fs.readFileSync(target, 'utf8');
    } catch (_) {
      return null;
    }
  }

  _writeFile(target, data, encoding) {
    this._fs.mkdirSync(path.dirname(target), { recursive: true });
    if (encoding) this._fs.writeFileSync(target, data, encoding);
    else this._fs.writeFileSync(target, data);
  }

  static _writeResult(rel, text, validation) {
    return {
      ok: validation.ok,
      path: rel,
      bytes: Buffer.byteLength(text, 'utf8'),
      validation,
      diagnostics: validation.diagnostics,
      summary: CodeValidator.formatForModel(validation),
    };
  }

  static _editResult(rel, edited, validation) {
    return {
      ok: true,
      path: rel,
      edits: edited.applied.length,
      bytes: Buffer.byteLength(edited.content, 'utf8'),
      valid: validation.ok,
      summary: CodeValidator.formatForModel(validation),
    };
  }

  static _bytesRefusal(existing, overwrite, rel) {
    if (existing && existing.isDirectory()) {
      return { ok: false, path: rel, code: 'FS_IS_DIRECTORY', error: `Write refused: ${rel} is a directory.` };
    }
    if (existing && !overwrite) {
      return {
        ok: false,
        path: rel,
        code: 'FS_EXISTS',
        error: `Write refused: ${rel} already exists. Pass overwrite: true to replace it, or choose another path.`,
      };
    }
    return null;
  }

  static _text(content) {
    return String(content == null ? '' : content);
  }
}

module.exports = WorkspaceMutations;

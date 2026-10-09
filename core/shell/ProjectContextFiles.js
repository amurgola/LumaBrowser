const fs = require('fs');
const path = require('path');

class ProjectContextFiles {
  static CANDIDATES = ['AGENTS.override.md', 'AGENTS.md', 'CLAUDE.md', 'LUMA.md'];
  static DEFAULT_MAX_BYTES = 16 * 1024;
  static DEFAULT_MAX_DEPTH = 8;

  static collect(rootDir, options = {}) {
    if (!rootDir || typeof rootDir !== 'string') return { files: [], totalBytes: 0 };
    const fsOps = options.fsOps || fs;
    const maxBytes = ProjectContextFiles._positiveOr(options.maxBytes, ProjectContextFiles.DEFAULT_MAX_BYTES);
    const maxDepth = ProjectContextFiles._positiveOr(options.maxDepth, ProjectContextFiles.DEFAULT_MAX_DEPTH);
    const dirs = ProjectContextFiles._farthestFirst(path.resolve(rootDir), fsOps, maxDepth);
    return ProjectContextFiles._readWithinBudget(dirs, fsOps, maxBytes);
  }

  static render(collected) {
    const files = collected && Array.isArray(collected.files) ? collected.files : [];
    if (!files.length) return '';
    const blocks = files.map(ProjectContextFiles._renderFile).join('\n');
    return '<project_context>\n'
      + 'Instructions left in the project for agents working on it. Follow them; they override general guidance.\n'
      + `${blocks}\n</project_context>`;
  }

  static _renderFile(file) {
    const marker = file.truncated ? '\n[truncated]' : '';
    return `<project_instructions path="${file.path}">\n${file.content.trim()}${marker}\n</project_instructions>`;
  }

  static _positiveOr(value, fallback) {
    return Number(value) > 0 ? Number(value) : fallback;
  }

  static _farthestFirst(rootDir, fsOps, maxDepth) {
    return ProjectContextFiles._ancestorsToGitRoot(rootDir, fsOps, maxDepth).reverse();
  }

  static _ancestorsToGitRoot(rootDir, fsOps, maxDepth) {
    const dirs = [];
    let dir = rootDir;
    for (let i = 0; i < maxDepth; i++) {
      dirs.push(dir);
      if (ProjectContextFiles._isGitRoot(dir, fsOps)) break;
      const parent = path.dirname(dir);
      if (!parent || parent === dir) break;
      dir = parent;
    }
    return dirs;
  }

  static _readWithinBudget(dirs, fsOps, maxBytes) {
    const files = [];
    let budget = maxBytes;
    for (const dir of dirs) {
      const file = ProjectContextFiles._readDirectory(dir, fsOps, budget);
      if (!file) continue;
      budget -= Buffer.byteLength(file.content, 'utf8');
      files.push(file);
      if (budget <= 0) break;
    }
    return { files, totalBytes: maxBytes - budget };
  }

  static _readDirectory(dir, fsOps, budget) {
    const found = ProjectContextFiles._firstCandidate(dir, fsOps);
    const content = found && ProjectContextFiles._readText(found, fsOps);
    if (!content || !content.trim()) return null;
    if (Buffer.byteLength(content, 'utf8') <= budget) return { path: found, content, truncated: false };
    return { path: found, content: ProjectContextFiles._clipToBytes(content, budget), truncated: true };
  }

  static _readText(file, fsOps) {
    try { return String(fsOps.readFileSync(file, 'utf8')); } catch (_) { return null; }
  }

  static _isGitRoot(dir, fsOps) {
    try { return fsOps.existsSync(path.join(dir, '.git')); } catch (_) { return false; }
  }

  static _firstCandidate(dir, fsOps) {
    for (const name of ProjectContextFiles.CANDIDATES) {
      const candidate = path.join(dir, name);
      try { if (fsOps.existsSync(candidate) && fsOps.statSync(candidate).isFile()) return candidate; } catch (_) {}
    }
    return null;
  }

  static _clipToBytes(text, bytes) {
    if (bytes <= 0) return '';
    let clipped = Buffer.from(text, 'utf8').subarray(0, bytes).toString('utf8');
    while (Buffer.byteLength(clipped, 'utf8') > bytes) clipped = clipped.slice(0, -1);
    const newline = clipped.lastIndexOf('\n');
    return newline > 0 ? clipped.slice(0, newline) : clipped;
  }
}

module.exports = ProjectContextFiles;

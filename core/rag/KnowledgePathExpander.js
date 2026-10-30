

const fs = require('fs');
const path = require('path');
const DocumentParser = require('./DocumentParser');

class KnowledgePathExpander {
  static expand(paths) {
    const files = [];
    const emptyFolders = [];
    const seen = new Set();
    const push = (file) => {
      const key = path.resolve(file);
      if (seen.has(key)) return;
      seen.add(key);
      files.push(file);
    };
    for (const entry of paths || []) {
      if (!KnowledgePathExpander.isFolder(entry)) {
        push(entry);
        continue;
      }
      const found = KnowledgePathExpander._documentsUnder(entry);
      if (!found.length) emptyFolders.push(entry);
      found.forEach(push);
    }
    return { files, emptyFolders };
  }

  static isFolder(entry) {
    try {
      return fs.statSync(String(entry)).isDirectory();
    } catch (_) {
      return false;
    }
  }

  static _documentsUnder(dir) {
    const out = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true })
      .filter((e) => !e.name.startsWith('.'))
      .sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) out.push(...KnowledgePathExpander._documentsUnder(full));
      else if (entry.isFile() && DocumentParser.isSupported(full)) out.push(full);
    }
    return out;
  }

  static emptyFolderResult(folder) {
    return {
      path: folder,
      success: false,
      error: `No supported documents in that folder (${DocumentParser.supportedExtensions().join(', ')}).`,
    };
  }
}

module.exports = KnowledgePathExpander;

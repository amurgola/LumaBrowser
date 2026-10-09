const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class GameKnowledgeBase {
  static SCOPE = 'gamedev';
  static DOCS_DIR = path.join(__dirname, 'docs');

  static rag() {
    const rag = global.__lumaRagService;
    return rag && typeof rag.ingestFile === 'function' ? rag : null;
  }

  static seed(rag = GameKnowledgeBase.rag(), docsDir = GameKnowledgeBase.DOCS_DIR) {
    if (!rag) return;
    for (const file of GameKnowledgeBase._markdownFiles(docsDir)) {
      Promise.resolve(rag.ingestFile(path.join(docsDir, file), { scope: GameKnowledgeBase.SCOPE })).catch(() => {});
    }
  }

  static async ingestPage({ rag, url, text, cacheDir }) {
    const file = path.join(cacheDir, `${crypto.createHash('sha1').update(url).digest('hex')}.md`);
    fs.mkdirSync(cacheDir, { recursive: true });
    fs.writeFileSync(file, `# ${url}\n\n${text}\n`, 'utf8');
    await rag.ingestFile(file, { scope: GameKnowledgeBase.SCOPE });
    return file;
  }

  static _markdownFiles(docsDir) {
    try { return fs.readdirSync(docsDir).filter((f) => f.endsWith('.md')); } catch (_) { return []; }
  }
}

module.exports = GameKnowledgeBase;

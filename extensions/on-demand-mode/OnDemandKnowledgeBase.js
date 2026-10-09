const fs = require('fs');
const path = require('path');

class OnDemandKnowledgeBase {
  static SCOPE = 'webnav';

  seed(docsDir) {
    const rag = OnDemandKnowledgeBase._rag();
    if (!rag || typeof rag.ingestFile !== 'function') return 0;
    const files = OnDemandKnowledgeBase._markdownFiles(docsDir);
    if (!files) return 0;
    for (const file of files) OnDemandKnowledgeBase._ingest(rag, path.join(docsDir, file));
    return files.length;
  }

  docCount() {
    const rag = OnDemandKnowledgeBase._rag();
    try {
      return rag && typeof rag.count === 'function' ? (rag.count(OnDemandKnowledgeBase.SCOPE) || 0) : 0;
    } catch (_) {
      return 0;
    }
  }

  static _rag() {
    return global.__lumaRagService;
  }

  static _markdownFiles(docsDir) {
    try {
      return fs.readdirSync(docsDir).filter((file) => file.endsWith('.md'));
    } catch (_) {
      return null;
    }
  }

  static _ingest(rag, filePath) {
    Promise.resolve(rag.ingestFile(filePath, { scope: OnDemandKnowledgeBase.SCOPE })).catch(() => {});
  }
}

module.exports = OnDemandKnowledgeBase;

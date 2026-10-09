const fs = require('fs');
const path = require('path');

class DocsCommand {
  static DOCS_DIR = __dirname;

  static TOPICS = [
    { id: 'local-api', description: 'OpenAI and Anthropic endpoints for the loaded model on this computer', file: 'local-api.md' },
    { id: 'api', description: 'REST API for browser automation (tabs, pages, actions)', file: 'api.md' },
    { id: 'tools', description: 'MCP tool groups and what each tool does', file: 'tools.md' },
    { id: 'remote-access', description: 'Reach a LumaBrowser on another machine, from WSL, or over SSH', file: 'remote-access.md' },
  ];

  static listTopics() {
    return DocsCommand.TOPICS.map((t) => ({ id: t.id, description: t.description }));
  }

  static findTopic(id) {
    return DocsCommand.TOPICS.find((t) => t.id === id) || null;
  }

  static readTopic(id) {
    const t = DocsCommand.findTopic(id);
    if (!t) return null;
    const text = fs.readFileSync(path.join(DocsCommand.DOCS_DIR, t.file), 'utf8');
    return text.endsWith('\n') ? text : `${text}\n`;
  }

  static directoryText() {
    const w = Math.max(...DocsCommand.TOPICS.map((t) => t.id.length));
    return `luma docs <topic>\n\n${DocsCommand.TOPICS.map((t) => `  ${t.id.padEnd(w)}  ${t.description}`).join('\n')}\n`;
  }

  static run(args, { stdout = process.stdout, stderr = process.stderr } = {}) {
    const id = (args[0] || '').trim();
    if (!id) { stdout.write(DocsCommand.directoryText()); return 0; }
    const text = DocsCommand.readTopic(id);
    if (text === null) {
      stderr.write(`luma docs: no topic "${id}". Topics: ${DocsCommand.TOPICS.map((t) => t.id).join(', ')}\n`);
      return 1;
    }
    stdout.write(text);
    return 0;
  }
}

module.exports = DocsCommand;

const fs = require('fs');
const path = require('path');

class McpServerEntry {
  static SERVER_NAME = 'luma-browser';
  static SCRIPT = 'mcp-server.js';
  static PORT_KEY = 'core.apiPort';
  static DEFAULT_PORT = 3000;

  static build({ db, rootDir, isPackaged }) {
    const port = db.get(McpServerEntry.PORT_KEY, McpServerEntry.DEFAULT_PORT);
    const scriptPath = isPackaged
      ? path.join(rootDir, '..', 'app.asar.unpacked', McpServerEntry.SCRIPT)
      : path.join(rootDir, McpServerEntry.SCRIPT);
    return { command: 'node', args: [scriptPath], env: { LUMA_API_PORT: String(port) } };
  }

  static clientConfig(entry) {
    return { mcpServers: { [McpServerEntry.SERVER_NAME]: entry } };
  }

  static async exportConfig(entry, chooseSavePath) {
    const choice = await chooseSavePath();
    if (choice.canceled) return { success: false, canceled: true };
    fs.writeFileSync(choice.filePath, JSON.stringify(McpServerEntry.clientConfig(entry), null, 2), 'utf8');
    return { success: true, filePath: choice.filePath };
  }
}

module.exports = McpServerEntry;

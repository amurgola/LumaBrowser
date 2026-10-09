const ReadTriggerFileTool = require('./file-tools/ReadTriggerFileTool');
const WriteWatchDirFileTool = require('./file-tools/WriteWatchDirFileTool');

class TriggerFileTools {
  static build(trigger, event = null) {
    const source = (trigger && trigger.source) || {};
    if (!source.dir) return [];
    const tools = [new ReadTriggerFileTool(source.dir, (event && event.path) || null).definition()];
    if (source.allowWrite) tools.push(new WriteWatchDirFileTool(source.dir).definition());
    return tools;
  }
}

module.exports = TriggerFileTools;

class InheritedDebugEnv {
  static NODE_OPTIONS = 'NODE_OPTIONS';
  static IDE_KEYS = /^(JB_IDE_HOST|JB_IDE_PORT|JB_INTERPRETER|VSCODE_INSPECTOR_OPTIONS|NODE_INSPECT_RESUME_ON_START)$/i;
  static WORD = /"[^"]*"|\S+/g;
  static PRELOAD_FLAG = /^(--require|-r|--import)$/;
  static PRELOAD_ASSIGNED = /^(--require|--import)=/;
  static INSPECT_FLAG = /^--inspect/;
  static DEBUGGER_PRELOAD = /debugConnector|nodeDebugInitializer|js-debug|bootloader\.(c?js|bundle\.js)/i;

  static forOwnProcess(env) {
    const cleaned = InheritedDebugEnv._withoutIdeKeys(env);
    delete cleaned[InheritedDebugEnv._keyOf(cleaned)];
    return cleaned;
  }

  static forUserShell(env) {
    const cleaned = InheritedDebugEnv._withoutIdeKeys(env);
    const key = InheritedDebugEnv._keyOf(cleaned);
    if (cleaned[key] === undefined) return cleaned;
    const kept = InheritedDebugEnv.withoutDebugger(cleaned[key]);
    if (kept) cleaned[key] = kept;
    else delete cleaned[key];
    return cleaned;
  }

  static withoutDebugger(nodeOptions) {
    const words = String(nodeOptions || '').match(InheritedDebugEnv.WORD) || [];
    const kept = [];
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      if (InheritedDebugEnv.INSPECT_FLAG.test(word)) continue;
      if (InheritedDebugEnv.PRELOAD_ASSIGNED.test(word) && InheritedDebugEnv.DEBUGGER_PRELOAD.test(word)) continue;
      if (InheritedDebugEnv.PRELOAD_FLAG.test(word) && InheritedDebugEnv.DEBUGGER_PRELOAD.test(words[i + 1] || '')) { i++; continue; }
      kept.push(word);
    }
    return kept.join(' ');
  }

  static _withoutIdeKeys(env) {
    const cleaned = {};
    for (const [key, value] of Object.entries(env || {})) {
      if (!InheritedDebugEnv.IDE_KEYS.test(key)) cleaned[key] = value;
    }
    return cleaned;
  }

  static _keyOf(env) {
    return Object.keys(env).find((key) => key.toUpperCase() === InheritedDebugEnv.NODE_OPTIONS) || InheritedDebugEnv.NODE_OPTIONS;
  }
}

module.exports = InheritedDebugEnv;

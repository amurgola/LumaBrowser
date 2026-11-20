class BackgroundTaskRules {
  static MEDIA_LANE = 'media';
  static MEDIA_TOOLS = ['generate_image', 'edit_image', 'generate_video', 'animate_image', 'generate_music'];
  static TASK_TOOLS = ['run_in_background', 'background_task_status', 'stop_background_task'];

  static FOREGROUND_PREFIXES = ['desktop_', 'game_'];
  static FOREGROUND_TOOLS = [
    'terminal_list', 'terminal_open', 'terminal_send', 'terminal_read', 'terminal_close',
    'delegate_task', 'list_delegates', 'chat_with_agent', 'list_agents',
    'train_lora', 'lora_training_status', 'cancel_lora_training', 'apply_lora',
  ];

  static KIND_BUILTIN = 'builtin';
  static KIND_SESSION = 'session';
  static KIND_EXTENSION = 'extension';

  static refusal(tool, kind) {
    const name = String(tool || '');
    if (!name) return 'run_in_background needs "tool": the name of the tool to run, and "arguments": what to pass it.';
    if (BackgroundTaskRules.TASK_TOOLS.includes(name)) return 'A background task cannot start or manage another background task.';
    if (!kind) return `${name} cannot run in the background: it works on the page in this reply's own tab, or it is not a tool you have. Call it directly.`;
    if (kind === BackgroundTaskRules.KIND_BUILTIN && BackgroundTaskRules.MEDIA_TOOLS.includes(name)) return null;
    if (kind === BackgroundTaskRules.KIND_EXTENSION && !BackgroundTaskRules._staysInReply(name)) return null;
    return `${name} does not run in the background: call it directly in this reply.`;
  }

  static laneOf(tool) {
    return BackgroundTaskRules.MEDIA_TOOLS.includes(String(tool)) ? BackgroundTaskRules.MEDIA_LANE : null;
  }

  static _staysInReply(name) {
    return BackgroundTaskRules.FOREGROUND_TOOLS.includes(name)
      || BackgroundTaskRules.FOREGROUND_PREFIXES.some((prefix) => name.startsWith(prefix));
  }
}

module.exports = BackgroundTaskRules;

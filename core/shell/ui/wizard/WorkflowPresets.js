export default class WorkflowPresets {
  static LLM_DEPENDENT = new Set(['ai-chat', 'selenium-driver']);

  static PRESETS = [
    {
      id: 'chat',
      title: 'Chat',
      badge: 'Chat',
      desc: 'Private chat on this machine.',
      enabled: ['ai-chat', 'timed-tasks'],
      disabled: ['selenium-driver', 'notification-interceptor', 'network-watcher', 'page-change-detector'],
      hidden: true,
    },
    {
      id: 'create',
      title: 'Create',
      badge: 'Create',
      desc: 'Chat, images, roleplay, voice and game building.',
      enabled: ['ai-chat', 'timed-tasks', 'roleplay-mode', 'game-mode'],
      disabled: ['selenium-driver', 'notification-interceptor', 'network-watcher', 'page-change-detector'],
      hidden: true,
    },
    {
      id: 'agent-toolkit',
      title: 'Agent toolkit',
      badge: 'LLM',
      desc: 'AI-driven browsing: chat with pages, drive automation via MCP or Selenium.',
      enabled: ['ai-chat', 'selenium-driver', 'timed-tasks'],
      disabled: ['notification-interceptor', 'network-watcher', 'page-change-detector'],
    },
    {
      id: 'notification-gateway',
      title: 'Notification Gateway',
      badge: 'Webhooks',
      desc: 'Intercept web notifications, watch pages for changes, and capture network responses, and forward all of it to any webhook endpoint.',
      enabled: ['notification-interceptor', 'network-watcher', 'page-change-detector', 'personal-hub'],
      disabled: ['ai-chat', 'selenium-driver', 'timed-tasks'],
    },
    {
      id: 'full-studio',
      title: 'Full Studio',
      badge: 'Everything',
      desc: 'Turn everything on. Great if you want to explore. You can disable any feature later in Settings.',
      enabled: ['ai-chat', 'selenium-driver', 'timed-tasks', 'notification-interceptor', 'network-watcher', 'page-change-detector', 'personal-hub'],
      disabled: [],
    },
    {
      id: 'custom',
      title: 'Custom',
      badge: 'Pick',
      desc: 'Choose each feature yourself. Recommended if you already know what you want.',
      custom: true,
    },
  ];

  static find(id) {
    return WorkflowPresets.PRESETS.find((p) => p.id === id) || null;
  }

  static visible() {
    return WorkflowPresets.PRESETS.filter((p) => !p.hidden);
  }

  static applyTo(overrides, presetId) {
    const preset = WorkflowPresets.find(presetId);
    if (!preset || preset.custom) return;
    for (const id of preset.enabled) overrides.set(id, true);
    for (const id of preset.disabled) overrides.set(id, false);
  }

  static needsLlm(enabledIds) {
    return enabledIds.some((id) => WorkflowPresets.LLM_DEPENDENT.has(id));
  }
}

const IntervalTaskScheduler = require('./schedulers/IntervalTaskScheduler');

class ArtifactTaskScheduler extends IntervalTaskScheduler {
  static GATE_OWNER = 'artifact-tasks';
  static KEEP_TRANSCRIPTS_KEY = 'core.artifactTasks.keepTranscripts';
  static MESSAGE_ID_PREFIX = 'atask-msg';
  static CATCH_UP_DELAY_MS = 5000;
  static DISABLED_ERROR = 'task is disabled';
  static OUTCOME_FIELD = 'summary';
  static MAX_LISTED_KEYS = 32;

  static SCHEDULED_RUN_TOOLS = [
    'web_search',
    'get_artifact_data',
    'update_artifact_data',
    'navigate', 'get_page_content', 'extract_text', 'browser_extract_data',
    'find_elements', 'get_tabs', 'create_tab', 'close_tab',
    'click_element', 'press_key', 'type_text', 'scroll_page', 'wait',
  ];

  constructor({ artifactDataStore = null, ...options } = {}) {
    super(options);
    this.artifactDataStore = artifactDataStore;
  }

  _runConfig(task) {
    return { modelRef: task.modelRef || null, allowedTools: ArtifactTaskScheduler.SCHEDULED_RUN_TOOLS };
  }

  _eventExtras(task) {
    return { rootId: task.rootId };
  }

  _buildRunPreamble(task) {
    const lines = [
      'SCHEDULED BACKGROUND RUN: no user is watching. You were set up to',
      `refresh the live widget "${task.title}" (artifactId: ${task.rootId}).`,
      'Do the task, then persist the results with update_artifact_data',
      `(artifactId "${task.rootId}") so the widget UI reflects them. Keep the`,
      'final text to a 1-3 sentence summary of what changed. Do NOT create',
      'artifacts or images.',
    ];
    const keysLine = this._savedKeysLine(task.rootId);
    if (keysLine) lines.push(keysLine);
    return lines.join(' ');
  }

  _savedKeysLine(rootId) {
    if (!this.artifactDataStore) return null;
    try {
      const snapshot = this.artifactDataStore.all(rootId);
      if (!snapshot.success) return null;
      const keys = Object.keys(snapshot.data || {});
      return keys.length
        ? `Current saved data keys: ${keys.slice(0, ArtifactTaskScheduler.MAX_LISTED_KEYS).join(', ')}. Read them with get_artifact_data first if you need the existing values.`
        : 'The widget has no saved data yet.';
    } catch (_) {
      return null;
    }
  }
}

module.exports = ArtifactTaskScheduler;

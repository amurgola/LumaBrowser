const ToolSchemas = require('../../../ToolSchemas');
const ArtifactId = require('../artifacts/ArtifactId');
const ChatToolHandler = require('./ChatToolHandler');

class ScheduleArtifactUpdatesHandler extends ChatToolHandler {
  static UNAVAILABLE = 'Scheduled updates are not available.';
  static DEFAULT_TITLE = 'Scheduled update';

  names() {
    return ['schedule_artifact_updates'];
  }

  async execute(_name, params, ctx) {
    const taskStore = ctx.deps.artifactTaskStore;
    if (!taskStore) return { success: false, error: ScheduleArtifactUpdatesHandler.UNAVAILABLE };
    const artifactId = ArtifactId.from(params);
    const prompt = params && params.prompt;
    const everyMinutes = params && (params.everyMinutes || params.every_minutes || params.minutes);
    if (!artifactId || !prompt || !everyMinutes) {
      return { success: false, error: `schedule_artifact_updates requires "artifactId", "prompt" and "everyMinutes" (${ToolSchemas.MIN_EVERY_MINUTES}-${ToolSchemas.MAX_EVERY_MINUTES}).` };
    }
    const dataStore = ctx.deps.artifactDataStore;
    const rootId = dataStore ? dataStore.resolveRootId(artifactId) : artifactId;
    if (!rootId) return { success: false, error: `unknown artifact "${artifactId}".` };
    return ScheduleArtifactUpdatesHandler._create(taskStore, { rootId, params, prompt, everyMinutes });
  }

  static _create(taskStore, { rootId, params, prompt, everyMinutes }) {
    try {
      const task = taskStore.create({
        rootId,
        title: (params && params.title) || ScheduleArtifactUpdatesHandler.DEFAULT_TITLE,
        prompt: String(prompt),
        intervalMs: Math.round(Number(everyMinutes) * 60 * 1000),
      });
      const minutes = Math.round(task.intervalMs / 60000);
      return {
        success: true,
        taskId: task.id,
        everyMinutes: minutes,
        nextRunAt: task.nextRunAt,
        message: `Scheduled: "${task.title}" will run every ${minutes} minutes. Tell the user it can be managed (edit, run now, history, disable) from the Dashboard tab.`,
      };
    } catch (err) {
      return { success: false, error: `schedule_artifact_updates failed: ${err.message}` };
    }
  }
}

module.exports = ScheduleArtifactUpdatesHandler;

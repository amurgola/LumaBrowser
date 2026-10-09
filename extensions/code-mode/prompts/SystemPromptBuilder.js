const PromptText = require('./PromptText');
const EnvironmentBlocks = require('./EnvironmentBlocks');
const ProjectPrompt = require('./ProjectPrompt');

class SystemPromptBuilder {
  static build(data = {}, opts = {}) {
    if (opts.mode === 'project') return ProjectPrompt.build(data, opts);
    return [
      PromptText.BUILD_IDENTITY,
      PromptText.EXTENSION_GROUNDING,
      EnvironmentBlocks.apiReference(opts.environment),
      PromptText.BROWSER_API,
      EnvironmentBlocks.environment(opts.environment),
      PromptText.VALIDATION_NOTE,
      opts.hasTools ? PromptText.TOOL_WORKFLOW : PromptText.NO_TOOL_WORKFLOW,
      SystemPromptBuilder._buildGoal(data),
    ].filter(Boolean).join('\n\n');
  }

  static _buildGoal(data) {
    const task = SystemPromptBuilder._text(data.task);
    if (!task) return '<user_goal>\nNo build brief yet: ask the user what extension or code they want, then proceed.\n</user_goal>';
    const name = SystemPromptBuilder._text(data.name);
    const targetId = SystemPromptBuilder._text(data.targetId);
    return `<user_goal>\nThe user wants to build:\n${task}\n${name ? `Preferred name: ${name}.\n` : ''}`
      + `${targetId ? `Target extension id: ${targetId}.\n` : ''}</user_goal>`;
  }

  static _text(value) {
    return (value && String(value).trim()) || '';
  }
}

module.exports = SystemPromptBuilder;

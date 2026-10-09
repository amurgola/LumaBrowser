export default class CodeKickoff {
  static message(data) {
    const task = data && data.task ? String(data.task).trim() : '';
    const projectPath = data && data.projectPath ? String(data.projectPath).trim() : '';
    return projectPath ? CodeKickoff._project(projectPath, task) : CodeKickoff._vibe(task);
  }

  static _project(projectPath, task) {
    return task
      ? `Work on the project at ${projectPath}. Task:\n${task}\n\nStart with project_overview, then read the relevant files. Only create or change files if the task calls for it: for a question or an explanation, answer in the chat instead of writing a document.`
      : `I want to work on the project at ${projectPath}. Start with project_overview and ask me what to do.`;
  }

  static _vibe(task) {
    return task
      ? `Build this LumaBrowser extension: ${task}\n\nPlan the files, then create each with write_extension_file (fix any validation errors it reports), and call install_extension when everything is written and clean.`
      : 'Help me build a LumaBrowser extension.';
  }
}

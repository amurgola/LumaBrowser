const CoreRequire = require('../CoreRequire');
const PromptText = require('./PromptText');

const ContainerPath = CoreRequire.require('shell/ContainerPath');

class ProjectPrompt {
  static build(data, opts) {
    const fromTerminal = data.origin === 'terminal';
    return [
      PromptText.PROJECT_IDENTITY,
      ProjectPrompt._persona(opts.persona),
      ProjectPrompt.project(ProjectPrompt._text(data.projectPath)),
      fromTerminal ? PromptText.TERMINAL_NOTE : null,
      opts.contextFiles || null,
      opts.hasTools ? PromptText.PROJECT_WORKFLOW : PromptText.NO_TOOL_WORKFLOW,
      opts.hasTools && opts.hasCommand ? PromptText.COMMANDS_NOTE : null,
      opts.hasTools ? ProjectPrompt.parallelism(opts.batchConcurrency) : null,
      PromptText.VALIDATION_NOTE,
      ProjectPrompt._goal(ProjectPrompt._text(data.task), fromTerminal),
    ].filter(Boolean).join('\n\n');
  }

  static project(projectPath) {
    if (!projectPath) return null;
    const at = ContainerPath.parse(projectPath);
    if (!at) return `<project>\nWorking directory (project root): ${projectPath}\nAll tool paths are relative to this root.\n</project>`;
    return `<project>
You are working inside a Linux container. Project root (and run_command's default directory): ${at.posix}
File tools (read_file, edit_file, write_file, grep, find, list_dir) cover files under ${at.posix}; give them a
path relative to it, or an absolute path inside it. For anything elsewhere in the container (/etc, /usr, home
directories, installed packages) use run_command. Commands run in the container's bash, not on the user's machine.
</project>`;
  }

  static parallelism(concurrency) {
    if (!(Number(concurrency) > 1)) return null;
    return `<parallelism>
This server runs ${concurrency} prediction slots, so you can work on up to ${concurrency} things at once with
the dispatch_batch tool. When the task splits into INDEPENDENT pieces (exploring several areas, or editing
several files that don't overlap) send them as one dispatch_batch call (each task is "explore" for read-only
investigation, or "edit" with its target "files" listed). The results come back together; review them, then
continue. Keep dependent steps sequential and do them yourself. Don't fan out trivial work: the overhead only
pays off when pieces are genuinely independent.
</parallelism>`;
  }

  static _persona(persona) {
    return persona ? `<agent_persona>\n${String(persona).trim()}\n</agent_persona>` : null;
  }

  static _goal(task, fromTerminal) {
    if (task) return `<user_goal>\nThe user wants you to work on this project and:\n${task}\n</user_goal>`;
    if (fromTerminal) return null;
    return '<user_goal>\nNo task yet: ask the user what they want done in this project, then proceed.\n</user_goal>';
  }

  static _text(value) {
    return (value && String(value).trim()) || '';
  }
}

module.exports = ProjectPrompt;

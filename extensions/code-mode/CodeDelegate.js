const fs = require('fs');

class CodeDelegate {
  static BUILD = 'build-extension';
  static PROJECT = 'code-project';

  static TARGETS = [
    {
      id: CodeDelegate.BUILD,
      label: 'Code: build a LumaBrowser extension',
      description: 'Designs, writes, validates and installs a real LumaBrowser extension live (manifest, main, '
        + 'renderer, page scripts). Use for any request to make, build or "create it as" an extension or add-on.',
      params: {
        task: { type: 'string', required: true, description: 'What the extension should do, with every detail the user gave (sites, styles, behaviour).' },
        name: { type: 'string', description: 'Optional extension name.' },
      },
    },
    {
      id: CodeDelegate.PROJECT,
      label: 'Code: work on a project folder',
      description: 'A coding agent that reads, searches, edits and runs commands in a folder on disk.',
      params: {
        projectPath: { type: 'string', required: true, description: 'Absolute path of the project folder.' },
        task: { type: 'string', required: true, description: 'What to do in the project.' },
      },
    },
  ];

  static spec(fsImpl = fs) {
    return {
      targets: CodeDelegate.TARGETS,
      start: ({ targetId, args }) => CodeDelegate.start(targetId, args, fsImpl),
    };
  }

  static start(targetId, args, fsImpl = fs) {
    const task = CodeDelegate._text(args && args.task);
    if (targetId === CodeDelegate.PROJECT) return CodeDelegate._project(CodeDelegate._text(args && args.projectPath), task, fsImpl);
    const name = CodeDelegate._text(args && args.name);
    return {
      data: { kind: 'build', task, ...(name ? { name } : {}) },
      message: `Build this LumaBrowser extension: ${task}\n\nPlan the files, then create each with write_extension_file (fix any validation errors it reports), and call install_extension when everything is written and clean.`,
      title: name || task,
    };
  }

  static _project(projectPath, task, fsImpl) {
    if (!projectPath) return { error: 'code-project needs "projectPath", the folder to work in.' };
    if (!CodeDelegate._isDir(projectPath, fsImpl)) return { error: `"${projectPath}" is not a folder on this machine.` };
    return {
      data: { kind: 'project', projectPath, task },
      message: `Work on the project at ${projectPath}. Task:\n${task}\n\nStart with project_overview, then read the relevant files. Only create or change files if the task calls for it: for a question or an explanation, answer in the chat instead of writing a document.`,
      title: task,
    };
  }

  static _isDir(p, fsImpl) {
    try { return fsImpl.statSync(p).isDirectory(); } catch (_) { return false; }
  }

  static _text(value) {
    return (value && String(value).trim()) || '';
  }
}

module.exports = CodeDelegate;

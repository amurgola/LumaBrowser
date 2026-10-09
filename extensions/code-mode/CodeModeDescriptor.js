const path = require('path');
const CodeTurnBuilder = require('./turn/CodeTurnBuilder');
const BuildStatePersister = require('./turn/BuildStatePersister');

class CodeModeDescriptor {
  static MODE_ID = 'code';

  static SETUP_SCHEMA = {
    title: 'New Code session',
    subtitle: 'Work on a project folder on disk, or build a brand-new LumaBrowser extension.',
    submitLabel: 'Start',
    fields: [
      {
        key: 'kind',
        label: 'What do you want to do?',
        type: 'select',
        options: [
          { value: 'project', label: 'Work on a project folder' },
          { value: 'build', label: 'Build a new LumaBrowser extension' },
        ],
      },
      {
        key: 'projectPath',
        label: 'Project folder',
        type: 'text',
        browse: 'directory',
        required: true,
        placeholder: 'C:\\Users\\you\\projects\\my-app',
        showIf: { key: 'kind', equals: 'project' },
      },
      {
        key: 'task',
        label: 'What should it do?',
        type: 'textarea',
        required: true,
        placeholder: 'e.g. Add input validation to the signup form, or an extension that adds a "Reading time" badge.',
      },
      {
        key: 'name',
        label: 'Extension name',
        type: 'text',
        hint: '(optional)',
        placeholder: 'Reading Time',
        showIf: { key: 'kind', equals: 'build' },
      },
    ],
  };

  static workspaceRoot(sessions, { conversationId, meta }) {
    const data = (meta && meta.data) || {};
    const projectPath = data.projectPath && String(data.projectPath).trim();
    if (projectPath) return { root: projectPath, label: path.basename(projectPath) };
    const s = sessions.get(conversationId);
    if (s && s.dir) return { root: s.dir, label: s.id || 'Extension' };
    const build = data.build;
    return build && build.dir ? { root: build.dir, label: build.id || 'Extension' } : null;
  }

  static create(context, sessions) {
    const turns = new CodeTurnBuilder({ context, sessions });
    const persister = new BuildStatePersister({ context, sessions });
    return {
      id: CodeModeDescriptor.MODE_ID,
      label: 'Code',
      icon: '🛠️',
      description: 'Build a LumaBrowser extension (or write code) with an agent that validates as it goes.',
      requirements: ['llm'],
      chatUiUrl: context.chat.uiUrl('chat-ui.js'),
      setupSchema: CodeModeDescriptor.SETUP_SCHEMA,
      workspaceRoot: (args) => CodeModeDescriptor.workspaceRoot(sessions, args),
      buildTurn: (args) => turns.build(args),
      postProcess: (args) => persister.run(args),
    };
  }
}

module.exports = CodeModeDescriptor;

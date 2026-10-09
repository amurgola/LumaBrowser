import ChatState from './ChatState.js';

export default class ChatContext {
  static COLLABORATORS = ['chatExt', 'voiceFactory', 'codeEditor', 'setupNav'];

  constructor(collaborators) {
    this.api = null;
    this.root = null;
    this.resonant = null;
    this.state = new ChatState();
    this.els = {};
    this.collaborators = { chatExt: null, voiceFactory: null, codeEditor: null, setupNav: null };
    this.setCollaborators(collaborators);
  }

  setCollaborators(partial) {
    for (const name of ChatContext.COLLABORATORS) {
      if (partial && partial[name] !== undefined) this.collaborators[name] = partial[name] || null;
    }
  }

  chatExt() {
    return this.collaborators.chatExt;
  }

  codeEditor() {
    return this.collaborators.codeEditor;
  }

  codeEditorDocked() {
    const ce = this.collaborators.codeEditor;
    return !!(ce && typeof ce.isDocked === 'function' && ce.isDocked());
  }

  modeDef(modeId) {
    const ext = this.collaborators.chatExt;
    return ext && typeof ext.getMerged === 'function' ? ext.getMerged(modeId) : null;
  }

  switchToSetup() {
    window.dispatchEvent(new CustomEvent('luma-switch-mode', { detail: 'setup' }));
  }
}

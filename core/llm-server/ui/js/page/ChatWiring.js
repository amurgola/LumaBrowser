import LumaChatExt from '../chat-ext/LumaChatExt.js';
import ChatMode from '../chat/ChatMode.js';
import CodeEditor from '../code/CodeEditor.js';
import ScheduledTaskMode from '../tasks/ScheduledTaskMode.js';
import TriggerCard from '../triggers/TriggerCard.js';
import TriggerMode from '../triggers/TriggerMode.js';
import VoiceController from '../voice/VoiceController.js';

export default class ChatWiring {
  constructor({ win = window } = {}) {
    this._win = win;
    this.chatExt = null;
    this.triggerCard = null;
    this.chatMode = null;
    this.codeEditor = null;
  }

  build() {
    this._installChatExt();
    this._registerCoreModes();
    this._buildChat();
    this._linkChatBack();
    return this;
  }

  setSetupNav(setupNav) {
    this.chatMode.setCollaborators({ setupNav });
  }

  _installChatExt() {
    this.chatExt = LumaChatExt.install(this._win);
  }

  _registerCoreModes() {
    this.triggerCard = new TriggerCard();
    new ScheduledTaskMode(this.chatExt).register();
    new TriggerMode(this.chatExt, { card: this.triggerCard }).register();
  }

  _buildChat() {
    this.codeEditor = new CodeEditor();
    this.chatMode = new ChatMode({ chatExt: this.chatExt, voiceFactory: VoiceController, codeEditor: this.codeEditor });
  }

  _linkChatBack() {
    this.codeEditor.setChatMode(this.chatMode);
    this.triggerCard.setChatMode(this.chatMode);
  }
}

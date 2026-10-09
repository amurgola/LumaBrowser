import ResonantRuntime from '../resonant/ResonantRuntime.js';
import ResonantTemplates from '../resonant/ResonantTemplates.js';
import FoldMemory from '../setup/FoldMemory.js';
import SegmentedPicker from '../setup/SegmentedPicker.js';
import ModeToggle from '../mode/ModeToggle.js';
import PreflightBanner from '../setup-ui/preflight/PreflightBanner.js';
import ChatWiring from './ChatWiring.js';
import SetupWiring from './SetupWiring.js';

export default class LlmTabPage {
  static CHAT_GLOBAL = 'LumaChatMode';

  constructor({ win = window, doc = document, api = win.llmDiagAPI } = {}) {
    this._win = win;
    this._doc = doc;
    this._api = api;
    this.chat = null;
    this.setup = null;
    this.modeToggle = null;
    this.preflight = null;
  }

  start() {
    this._installSharedLibrary();
    this._buildSurfaces();
    this._publishChat();
    this.setup.start();
    this._startModeToggle();
    this._startPreflight();
    return this;
  }

  _installSharedLibrary() {
    ResonantTemplates.registerAll(ResonantRuntime.shared());
    FoldMemory.install(this._doc);
    SegmentedPicker.install(this._doc);
  }

  _buildSurfaces() {
    this.chat = new ChatWiring({ win: this._win }).build();
    this.setup = new SetupWiring({ api: this._api, chatExt: this.chat.chatExt, doc: this._doc, win: this._win }).build();
    this.chat.setSetupNav(this.setup.navigator);
  }

  _publishChat() {
    this._win[LlmTabPage.CHAT_GLOBAL] = this.chat.chatMode;
  }

  _startModeToggle() {
    this.modeToggle = new ModeToggle({
      doc: this._doc,
      win: this._win,
      api: this._api,
      chatMode: this.chat.chatMode,
      codeEditor: this.chat.codeEditor,
      setupNav: this.setup.navigator,
    });
    this.modeToggle.start();
  }

  _startPreflight() {
    this.preflight = new PreflightBanner({ api: this._api, doc: this._doc, win: this._win });
    this.preflight.start();
  }
}

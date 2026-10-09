import SingleListener from './SingleListener.js';
import ShimModels from './ShimModels.js';
import ChatTurnRunner from './ChatTurnRunner.js';
import ShimConversations from './ShimConversations.js';
import ShimArtifacts from './ShimArtifacts.js';
import ShimArtifactData from './ShimArtifactData.js';
import ShimVoice from './ShimVoice.js';
import AttachmentReader from './AttachmentReader.js';
import HostThinking from './HostThinking.js';
import LocalPrefs from './LocalPrefs.js';

export default class LlmApiShim {
  static IMAGE_VIA_TOOLS = 'image generation runs via Tools';

  static build({ api, store, win = window, probe = true }) {
    const serverEvents = new SingleListener();
    const chatEvents = new SingleListener();
    const models = new ShimModels({ api, serverEvents, win, doc: win.document });
    if (probe) models.startProbing();
    const runner = new ChatTurnRunner({ api, store, events: chatEvents });
    return LlmApiShim._surface({
      api, store, win, serverEvents, chatEvents, models, runner,
      prefs: new LocalPrefs(win.localStorage),
      thinking: new HostThinking(api),
      attachments: new AttachmentReader({ doc: win.document, FileReaderImpl: win.FileReader }),
    });
  }

  static _surface(p) {
    return {
      chat2: (args) => p.runner.chat2(args),
      chatAbort: () => p.runner.chatAbort(),
      onChatEvent: (cb) => p.chatEvents.on(cb),
      voice: new ShimVoice(p.api).surface(),
      listModels: () => p.models.list(),
      onServerEvent: (cb) => p.serverEvents.on(cb),
      setLastModelRef: (ref) => p.prefs.setLastModelRef(ref),
      conv: new ShimConversations(p.store).surface(),
      artifact: new ShimArtifacts({ api: p.api, store: p.store, win: p.win }).surface(),
      artifactData: new ShimArtifactData({ api: p.api, win: p.win }).surface(),
      pickChatAttachment: () => p.attachments.pick(),
      readDroppedAttachments: (files) => p.attachments.readDropped(files),
      getSidebarCollapsed: () => p.prefs.getSidebarCollapsed(),
      setSidebarCollapsed: (v) => p.prefs.setSidebarCollapsed(v),
      chat: { listModes: () => LlmApiShim._listModes(p.api) },
      getDefaults: () => p.thinking.defaults(),
      getServerStatus: () => p.thinking.serverStatus(),
      image: LlmApiShim._imageStubs(),
    };
  }

  static async _listModes(api) {
    try {
      return { success: true, modes: await api.listChatModes() };
    } catch (_) {
      return { success: true, modes: [] };
    }
  }

  static _imageStubs() {
    return {
      getEnabled: () => Promise.resolve({ success: true, enabled: false }),
      getDefaults: () => Promise.resolve({ success: true, defaults: {} }),
      generate: () => ({ success: false, error: LlmApiShim.IMAGE_VIA_TOOLS }),
      onImageEvent: () => () => {},
    };
  }
}

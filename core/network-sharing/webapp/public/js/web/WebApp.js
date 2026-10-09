import LumaApi from '../transport/LumaApi.js';
import LumaStore from '../store/LumaStore.js';
import LlmApiShim from '../shim/LlmApiShim.js';
import PairingGate from './PairingGate.js';
import MobileModelInfo from './MobileModelInfo.js';
import ServiceWorkerRegistrar from './ServiceWorkerRegistrar.js';
import ChatMode from '../../../../../llm-server/ui/js/chat/ChatMode.js';
import LumaChatExt from '../../../../../llm-server/ui/js/chat-ext/LumaChatExt.js';
import VoiceController from '../../../../../llm-server/ui/js/voice/VoiceController.js';
import ResonantRuntime from '../../../../../llm-server/ui/js/resonant/ResonantRuntime.js';
import ResonantTemplates from '../../../../../llm-server/ui/js/resonant/ResonantTemplates.js';

export default class WebApp {
  static build(win = window, parts = {}) {
    const api = parts.api || new LumaApi({ win });
    const store = parts.store || LumaStore.open(win.indexedDB);
    const chatApi = parts.chatApi || LlmApiShim.build({ api, store, win });
    const chatExt = LumaChatExt.install(win);
    ResonantTemplates.registerAll(ResonantRuntime.shared());
    const chatMode = parts.chatMode || new ChatMode({ chatExt, voiceFactory: VoiceController });
    WebApp._publish(win, { api, chatApi, chatMode });
    const gate = new PairingGate({ api, chatApi, chatMode, doc: win.document, win });
    return { api, store, chatApi, chatExt, chatMode, gate };
  }

  static async boot(win = window, parts = {}) {
    const app = WebApp.build(win, parts);
    new MobileModelInfo({ api: app.api, win }).install(win.document);
    ServiceWorkerRegistrar.register(win);
    await app.gate.start();
    return app;
  }

  static _publish(win, { api, chatApi, chatMode }) {
    win.LumaAPI = api;
    win.llmDiagAPI = chatApi;
    win.LumaChatMode = chatMode;
  }
}

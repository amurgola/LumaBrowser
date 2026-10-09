import LlmTabPage from './page/LlmTabPage.js';

new LlmTabPage({ win: window, doc: document, api: window.llmDiagAPI }).start();

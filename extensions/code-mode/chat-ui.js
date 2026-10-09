import CodeChatMode from './ui/CodeChatMode.js';

const registry = window.LumaChatExt;

if (registry && typeof registry.registerMode === 'function') new CodeChatMode().register(registry);

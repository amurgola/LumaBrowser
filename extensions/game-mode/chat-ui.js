import GameChatMode from './ui/GameChatMode.js';

const registry = window.LumaChatExt;

if (registry && typeof registry.registerMode === 'function') new GameChatMode().register(registry, window);

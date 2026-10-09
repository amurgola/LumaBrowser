export default class SetupDeepLink {
  static CHAT_HASH = '#chat';

  static pageFromHash(hash) {
    const match = /^#setup(?:[/](.+))?$/.exec(String(hash || ''));
    return match ? decodeURIComponent(match[1] || 'settings') : null;
  }

  static isChat(hash) {
    return hash === SetupDeepLink.CHAT_HASH;
  }
}

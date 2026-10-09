class GameKind {
  static AI = 'ai';
  static WEB = 'web';

  static normalize(kind) {
    return kind === GameKind.AI ? GameKind.AI : GameKind.WEB;
  }
}

module.exports = GameKind;

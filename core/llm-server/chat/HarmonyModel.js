class HarmonyModel {
  static PATTERN = /gpt-?oss|harmony/i;

  static matches(modelRef) {
    return HarmonyModel.PATTERN.test(String(modelRef || ''));
  }
}

module.exports = HarmonyModel;

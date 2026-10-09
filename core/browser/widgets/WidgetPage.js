class WidgetPage {
  static NO_RESULT_ERROR = 'In-page script returned no result (the page may have navigated)';

  static async run(wc, script) {
    const result = await wc.executeJavaScript(script, false);
    return result || { success: false, error: WidgetPage.NO_RESULT_ERROR };
  }
}

module.exports = WidgetPage;

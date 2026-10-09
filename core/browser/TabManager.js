const TabRegistry = require('./tab-view/TabRegistry');
const WidgetDriver = require('./widgets/WidgetDriver');
const AccessibleAttributeMatcher = require('./tab-manager/AccessibleAttributeMatcher');
const DialogHandler = require('./tab-manager/DialogHandler');
const ElementClicker = require('./tab-manager/ElementClicker');
const ElementInspector = require('./tab-manager/ElementInspector');
const ElementWaiter = require('./tab-manager/ElementWaiter');
const FieldTyper = require('./tab-manager/FieldTyper');
const FormFiller = require('./tab-manager/FormFiller');
const InteractableElements = require('./tab-manager/InteractableElements');
const KeyPresser = require('./tab-manager/KeyPresser');
const PageObserver = require('./tab-manager/PageObserver');
const PageScroller = require('./tab-manager/PageScroller');
const PageSource = require('./tab-manager/PageSource');
const PointClicker = require('./tab-manager/PointClicker');
const RowDataExtractor = require('./tab-manager/RowDataExtractor');
const SettleWaiter = require('./tab-manager/SettleWaiter');
const TabControl = require('./tab-manager/TabControl');
const TabPage = require('./tab-manager/TabPage');
const TabScreenshot = require('./tab-manager/TabScreenshot');
const TableReader = require('./tab-manager/TableReader');

class TabManager {
  constructor(tabViewManager, { nativeImage = null } = {}) {
    this.tabViewManager = tabViewManager;
    this._control = new TabControl(tabViewManager);
    this._screenshot = new TabScreenshot(nativeImage);
  }

  async getAllTabs(options = {}) { return this._control.getAllTabs(options); }
  async createTab(url, options = {}) { return this._control.createTab(url, options); }
  async closeTab(tabId) { return this.tabViewManager.closeTab(tabId); }
  async waitForLoad(tabId, timeoutMs) { return this.tabViewManager.waitForLoad(tabId, timeoutMs); }
  async getConsoleLogs(tabId, options = {}) { return this._control.getConsoleLogs(tabId, options); }
  async updateTab(tabId, action) { return this._onTab(tabId, (page) => this._control.update(page, action)); }

  async getTabSource(tabId, options = {}) { return this._onTab(tabId, (page) => PageSource.read(page, options)); }
  async screenshotTab(tabId, options = {}) { return this._onTab(tabId, (page) => this._screenshot.capture(page, options)); }
  async observePage(tabId) { return this._onTab(tabId, (page) => PageObserver.observe(page)); }
  async waitForSettle(tabId, options = {}) { return this._onTab(tabId, (page) => SettleWaiter.wait(page, options)); }

  async clickElement(tabId, options = {}) { return this._onTab(tabId, (page) => ElementClicker.click(page, options)); }
  async pointInfo(tabId, x, y) { return this._onTab(tabId, (page) => PointClicker.pointInfo(page, x, y)); }
  async clickAt(tabId, options = {}) { return this._onTab(tabId, (page) => PointClicker.clickAt(page, options)); }
  async typeInto(tabId, options = {}) { return this._onTab(tabId, (page) => FieldTyper.typeInto(page, options)); }
  async fillForm(tabId, options = {}) { return this._onTab(tabId, (page) => FormFiller.fill(page, options)); }
  async pressKey(tabId, options = {}) { return this._onTab(tabId, (page) => KeyPresser.pressKey(page, options)); }
  async scrollPage(tabId, options = {}) { return this._onTab(tabId, (page) => PageScroller.scroll(page, options)); }
  async handleDialog(tabId, options = {}) { return this._onTab(tabId, (page) => DialogHandler.install(page, options)); }
  async waitForElement(tabId, options = {}) { return this._onTab(tabId, (page) => ElementWaiter.waitFor(page, options)); }

  async getElement(tabId, options = {}) { return this._onTab(tabId, (page) => ElementInspector.getElement(page, options)); }
  async checkSelectors(tabId, selectors) { return this._onTab(tabId, (page) => ElementInspector.checkSelectors(page, selectors)); }
  async getTable(tabId, options = {}) { return this._onTab(tabId, (page) => TableReader.read(page, options)); }
  async extractData(tabId, options = {}) { return this._onTab(tabId, (page) => RowDataExtractor.extract(page, options)); }
  async getInteractableElements(tabId, options = {}) { return this._onTab(tabId, (page) => InteractableElements.list(page, options)); }
  async findByAccessibleAttributes(tabId, description) {
    return this._onTab(tabId, (page) => AccessibleAttributeMatcher.find(page, description));
  }

  async selectOption(tabId, options = {}) { return this._onTab(tabId, (page) => WidgetDriver.selectOption(page.webContents, options || {})); }
  async setDate(tabId, options = {}) { return this._onTab(tabId, (page) => WidgetDriver.setDate(page.webContents, options || {})); }
  async setSlider(tabId, options = {}) { return this._onTab(tabId, (page) => WidgetDriver.setSlider(page.webContents, options || {})); }
  async collectList(tabId, options = {}) { return this._onTab(tabId, (page) => WidgetDriver.collectList(page.webContents, options || {})); }

  async _onTab(tabId, action) {
    const entry = this.tabViewManager.getEntry(tabId);
    if (!entry) return TabRegistry.notFound(tabId);
    try {
      return await action(new TabPage(entry, tabId, this.tabViewManager));
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = TabManager;

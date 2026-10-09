const PageScript = require('./PageScript');
const ElementEvaluator = require('./ElementEvaluator');
const ElementFinder = require('./ElementFinder');
const ScreenshotReader = require('./ScreenshotReader');
const SessionCommands = require('./commands/SessionCommands');
const NavigationCommands = require('./commands/NavigationCommands');
const WindowCommands = require('./commands/WindowCommands');
const FindCommands = require('./commands/FindCommands');
const ElementStateCommands = require('./commands/ElementStateCommands');
const ElementInteractionCommands = require('./commands/ElementInteractionCommands');
const ScriptCommands = require('./commands/ScriptCommands');
const CookieCommands = require('./commands/CookieCommands');
const CaptureCommands = require('./commands/CaptureCommands');
const AlertCommands = require('./commands/AlertCommands');
const ActionCommands = require('./commands/ActionCommands');
const LumabyteCommands = require('./commands/LumabyteCommands');

class WebDriverCommandTable {
  static GROUPS = [
    SessionCommands, NavigationCommands, WindowCommands, FindCommands, ElementStateCommands,
    ElementInteractionCommands, ScriptCommands, CookieCommands, CaptureCommands, AlertCommands,
    ActionCommands, LumabyteCommands,
  ];

  static build(ctx) {
    const tools = WebDriverCommandTable._tools(ctx);
    const table = new Map();
    for (const Group of WebDriverCommandTable.GROUPS) WebDriverCommandTable._addGroup(table, new Group(tools));
    return table;
  }

  static _tools(ctx) {
    const page = new PageScript(ctx.browser);
    return {
      ...ctx,
      page,
      elements: new ElementEvaluator(page),
      finder: new ElementFinder(page, ctx.fallback),
      screenshots: new ScreenshotReader(ctx.browser),
    };
  }

  static _addGroup(table, group) {
    for (const name of group.commandNames()) {
      if (table.has(name)) throw new Error(`WebDriver command "${name}" is defined twice`);
      table.set(name, group[name].bind(group));
    }
  }
}

module.exports = WebDriverCommandTable;

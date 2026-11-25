const UiTree = require('../device/UiTree');
const ToolReply = require('./ToolReply');

class AndroidToolCalls {
  static ACCESS_OFF = 'Android devices are switched off for AI. The user can allow them under Settings > Android.';
  static SCREENSHOT_CAPTION = 'Screenshot in screen pixels: its coordinates can be passed directly to android_tap and android_swipe.';

  constructor({ devices, sessions, tabs, settings }) {
    this._devices = devices;
    this._sessions = sessions;
    this._tabs = tabs;
    this._settings = settings;
  }

  async handle(toolName, args = {}) {
    if (!this._settings.read().agentAccess) return ToolReply.error(AndroidToolCalls.ACCESS_OFF);
    const tool = this._tools()[toolName];
    if (!tool) return ToolReply.error(`Unknown tool: ${toolName}`);
    try {
      return await tool(args || {});
    } catch (error) {
      return ToolReply.error(error.message);
    }
  }

  _tools() {
    const onDevice = (action) => async (args) => action(await this._session(args.device), args);
    return {
      android_list_devices: async () => ToolReply.done(await this._devices.overview()),
      android_start_device: async (args) => ToolReply.done(await this._devices.start(String(args.device || ''))),
      android_stop_device: async (args) => ToolReply.done({ stopped: await this._devices.stop(await this._runningName(args.device)) }),
      android_show_device: async (args) => ToolReply.done(await this._tabs.open(await this._runningName(args.device))),
      android_observe: onDevice(async (session) => ToolReply.lines(UiTree.format((await session.readScreen()).elements))),
      android_screenshot: onDevice(async (session) => ToolReply.image(await session.screenshot(), AndroidToolCalls.SCREENSHOT_CAPTION)),
      android_tap: onDevice(async (session, args) => { await session.tap(args.x, args.y); return ToolReply.done({ tapped: [args.x, args.y] }); }),
      android_swipe: onDevice(async (session, args) => { await session.swipe(args); return ToolReply.done({ swiped: true }); }),
      android_type: onDevice(async (session, args) => { await session.typeText(String(args.text || ''), { submit: !!args.submit }); return ToolReply.done({ typed: true }); }),
      android_press_key: onDevice(async (session, args) => AndroidToolCalls._pressed(args.key, await session.pressKey(args.key))),
      android_list_apps: onDevice(async (session) => ToolReply.done({ packages: await session.listApps() })),
      android_open_app: onDevice(async (session, args) => AndroidToolCalls._opened(args.package, await session.openApp(args.package))),
      android_notifications: onDevice(async (session) => ToolReply.done({ notifications: session.notifications() })),
    };
  }

  async _session(deviceName) {
    return this._sessions.open(await this._runningName(deviceName));
  }

  async _runningName(deviceName) {
    const running = await this._devices.runningNames();
    const name = String(deviceName || '');
    if (name) {
      if (running.includes(name)) return name;
      throw new Error(`${name} is not running. Start it with android_start_device.`);
    }
    if (running.length === 1) return running[0];
    if (!running.length) throw new Error('No device is running. Start one with android_start_device.');
    throw new Error(`Several devices are running (${running.join(', ')}): pass device.`);
  }

  static _pressed(key, known) {
    return known ? ToolReply.done({ pressed: key }) : ToolReply.error(`Unknown key: ${key}`);
  }

  static _opened(packageName, opened) {
    return opened ? ToolReply.done({ opened: packageName }) : ToolReply.error(`Could not open ${packageName}. Check the name with android_list_apps.`);
  }
}

module.exports = AndroidToolCalls;

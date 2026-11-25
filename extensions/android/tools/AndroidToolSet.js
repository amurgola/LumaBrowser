const DEVICE = { type: 'string', description: 'Device name from android_list_devices. Optional while exactly one device is running.' };
const X = { type: 'number', description: 'Horizontal screen pixel (from the left edge)' };
const Y = { type: 'number', description: 'Vertical screen pixel (from the top edge)' };

class AndroidToolSet {
  static TOOLS = Object.freeze([
    {
      name: 'android_list_devices',
      description: 'List the Android devices on this computer and whether each is stopped, starting or running.',
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'android_start_device',
      description: 'Start an Android device and wait until it has booted (a few seconds from its saved state, up to a minute cold).',
      inputSchema: { type: 'object', properties: { device: { type: 'string', description: 'Device name from android_list_devices' } }, required: ['device'] },
      mutating: true,
    },
    {
      name: 'android_stop_device',
      description: 'Shut an Android device down. It saves its state, so the next start is quick.',
      inputSchema: { type: 'object', properties: { device: DEVICE } },
      mutating: true,
    },
    {
      name: 'android_show_device',
      description: 'Open the device in a browser tab so the user can watch and use it.',
      inputSchema: { type: 'object', properties: { device: DEVICE } },
    },
    {
      name: 'android_observe',
      description: 'Read the screen of a device: one line per labelled or tappable element, as [x,y] role "label". Pass a line\'s x and y to android_tap. Takes about two seconds.',
      inputSchema: { type: 'object', properties: { device: DEVICE } },
    },
    {
      name: 'android_screenshot',
      description: 'Capture the screen of a device as a PNG. Its pixel coordinates can be passed straight to android_tap and android_swipe.',
      inputSchema: { type: 'object', properties: { device: DEVICE } },
    },
    {
      name: 'android_tap',
      description: 'Tap the screen of a device at a point read off android_observe or android_screenshot.',
      inputSchema: { type: 'object', properties: { device: DEVICE, x: X, y: Y }, required: ['x', 'y'] },
      mutating: true,
    },
    {
      name: 'android_swipe',
      description: 'Drag a finger across the screen, to scroll or swipe. To scroll down a list, swipe from low on the screen to high.',
      inputSchema: {
        type: 'object',
        properties: {
          device: DEVICE, fromX: X, fromY: Y, toX: X, toY: Y,
          durationMs: { type: 'number', description: 'How long the drag takes (default 300)' },
        },
        required: ['fromX', 'fromY', 'toX', 'toY'],
      },
      mutating: true,
    },
    {
      name: 'android_type',
      description: 'Type text into the field that has focus on the device (tap the field first). submit presses Enter afterwards.',
      inputSchema: {
        type: 'object',
        properties: { device: DEVICE, text: { type: 'string', description: 'The text to type' }, submit: { type: 'boolean', description: 'Press Enter after typing (default false)' } },
        required: ['text'],
      },
      mutating: true,
    },
    {
      name: 'android_press_key',
      description: 'Press a device key: back, home, recents, enter, backspace, delete, tab, escape, space, up, down, left, right, volume_up, volume_down or power.',
      inputSchema: { type: 'object', properties: { device: DEVICE, key: { type: 'string', description: 'Key name' } }, required: ['key'] },
      mutating: true,
    },
    {
      name: 'android_list_apps',
      description: 'List the package names of the apps on the device\'s launcher.',
      inputSchema: { type: 'object', properties: { device: DEVICE } },
    },
    {
      name: 'android_open_app',
      description: 'Open an app on the device by its package name (from android_list_apps), for example com.android.chrome.',
      inputSchema: { type: 'object', properties: { device: DEVICE, package: { type: 'string', description: 'Package name' } }, required: ['package'] },
      mutating: true,
    },
    {
      name: 'android_notifications',
      description: 'List the notifications showing on the device now: app package, title and text.',
      inputSchema: { type: 'object', properties: { device: DEVICE } },
    },
  ]);
}

module.exports = AndroidToolSet;

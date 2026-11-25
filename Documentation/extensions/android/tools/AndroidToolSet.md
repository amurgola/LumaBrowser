# AndroidToolSet

`extensions/android/tools/AndroidToolSet.js`

Data only: the `android_*` tools as chat and MCP clients see them.

## Methods

- `android_list_devices`, `android_start_device`, `android_stop_device`, `android_show_device`, `android_observe`, `android_screenshot`, `android_tap`, `android_swipe`, `android_type`, `android_press_key`, `android_list_apps`, `android_open_app`, `android_notifications`.
- `device` may be left out while exactly one device is running. Coordinates are screen pixels. The seven tools that change something are `mutating`, so a chat asks first.

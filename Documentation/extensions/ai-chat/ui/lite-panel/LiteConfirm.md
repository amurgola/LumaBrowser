# LiteConfirm

`extensions/ai-chat/ui/lite-panel/LiteConfirm.js`

The side panel's delete confirmation in `#aiChatConfirmModal`.

## Methods

- `new LiteConfirm({ modal, message, okBtn, cancelBtn })`: Cancel hides.
- `show(text, onOk)`: sets the message, adds `active`, and makes OK (one
  handler at a time) hide then run `onOk`. Without the modal it uses
  `window.confirm`.
- `hide()`, `isOpen()`.

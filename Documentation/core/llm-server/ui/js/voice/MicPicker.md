# MicPicker

`core/llm-server/ui/js/voice/MicPicker.js`

The microphone list: System default plus each input (Windows' virtual
default and communications entries skipped); picking one saves it and moves
the meter to it. A saved device that is gone is forgotten.

## Methods

- `new MicPicker(api, probe)`; `render(pop, note, initialErr?)`.

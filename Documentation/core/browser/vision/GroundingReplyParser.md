# GroundingReplyParser

`core/browser/vision/GroundingReplyParser.js`

Reads a click point (or box) out of a grounding model's reply, in whatever dialect it answers.

## Methods

- `GroundingReplyParser.parse(reply)` returns `{ point: { x, y }, bbox? }`, `{ infeasible: true }`,
  or `null` when nothing usable was found. Numbers are raw, in the model's own convention; unit
  conversion is CoordinateSpace's job.
- `GroundingReplyParser.stripReasoning(text)` removes `<think>` and `<grounding_think>` blocks,
  including an unterminated trailing `<think>`.

## Dialects

The parser is permissive about the envelope and strict about the numbers, because dialects drift
between releases:

| Reply | Family |
| --- | --- |
| `{"x": 512, "y": 88}` | Holo2/3/3.1/4 |
| `<answer>{"coordinate": [512, 88]}</answer>` | MAI-UI |
| `[512,88]` / `[-1,-1]` (infeasible) | UI-Venus-2, plain Qwen3.x |
| `{"bbox_2d": [x1, y1, x2, y2], "label": ...}` | Qwen3-VL detection habit |
| `click(start_box='(512,88)')` | UI-TARS |
| `<\|box_start\|>(512,88)<\|box_end\|>` | Qwen2.5-VL / OS-Atlas |
| `click(x=512, y=88)` / `Click(512, 88)` | pyautogui-style action heads |
| `<point>512 88</point>` | point tags |

JSON candidates are tried first (fenced block, `<answer>`, `<tool_call>`, outermost object, outermost
array), then text patterns. A box answer yields its centre as the point and keeps the box. Both
coordinates negative (point) or a negative first corner (box) means infeasible.

Reasoning is stripped first: a model that muses "the button at [10, 20] is wrong, the right one is..."
must not have its rejected candidate parsed as the answer.

# ShotOptions

`tools/docs/readme-shots/ShotOptions.js`

The command line of `npm run shots:readme`, parsed by `ShotOptions.parse(argv, rootDir)` into one value object.
Unknown flags and malformed values throw (the message carries `usage()`), so a typo never captures the wrong thing.

| Option | Field | Default |
|---|---|---|
| `--out <dir>` | `outDir` (resolved against the repo root) | `Documentation/images` |
| `--only <scenes>` | `scenes`, a subset of `chat, setup, fit` in that canonical order | all three |
| `--prompt <text>` | `prompt`, the question the chat scene asks | the README's llama.cpp release question |
| `--query <text>` | `query`, the Hugging Face search the fit scene types | `unsloth/Qwen3.6-27B-GGUF` |
| `--quant <text>` | `quant`, the quantization the fit scene selects; `none` keeps the dialog's default | `Q4_K_M` |
| `--model <text>` | `model`, substring of the local model ref or name to prefer | null (the default local model) |
| `--size <WxH>` | `size`, window content size in CSS pixels | `1600x1000` |
| `--timeout <sec>` | `timeoutMs`, how long one chat turn may take | 600 s |
| `--capture <mode>` | `capture`: `window` (desktopCapturer) or `screen` (Windows CopyFromScreen) | `window` |
| `--keep` | `keep`, leave the app running until Ctrl+C | false |

## Methods

- `static parse(argv, rootDir)`: the options object, or throws.
- `static usage()`: the help text.
- `_scenes`, `_size`, `_seconds`, `_capture`: value validators.

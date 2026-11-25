# IniFile

`extensions/android/sdk/IniFile.js`

Reads and writes the key=value files the Android SDK keeps (an AVD's `.ini` and `config.ini`, a system image's `source.properties`).

## Methods

- `IniFile.parse(text)`: comment lines and lines with no key are skipped; a value may hold `=`.
- `IniFile.format(values)`.

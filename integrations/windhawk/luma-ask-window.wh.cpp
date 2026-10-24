// ==WindhawkMod==
// @id              luma-ask-window
// @name            Ask LumaBrowser about this window
// @description     Adds "Ask Luma about this window" to every app's window menu (title bar right-click, Alt+Space): Luma reads the window and opens a chat about it
// @version         1.0
// @author          LumaBrowser
// @github          https://github.com/amurgola/LumaBrowser
// @include         *
// @exclude         LumaBrowser.exe
// @exclude         electron.exe
// @exclude         csrss.exe
// @exclude         smss.exe
// @exclude         wininit.exe
// @exclude         winlogon.exe
// @exclude         services.exe
// @exclude         lsass.exe
// @exclude         lsaiso.exe
// @exclude         svchost.exe
// @exclude         dwm.exe
// @exclude         fontdrvhost.exe
// @exclude         LogonUI.exe
// @exclude         consent.exe
// @exclude         CredentialUIBroker.exe
// @exclude         LockApp.exe
// @exclude         sihost.exe
// @exclude         ctfmon.exe
// @exclude         conhost.exe
// @exclude         OpenConsole.exe
// @exclude         dllhost.exe
// @exclude         taskhostw.exe
// @exclude         RuntimeBroker.exe
// @exclude         backgroundTaskHost.exe
// @exclude         WmiPrvSE.exe
// @exclude         spoolsv.exe
// @exclude         audiodg.exe
// @exclude         WUDFHost.exe
// @exclude         MsMpEng.exe
// @exclude         NisSrv.exe
// @exclude         SecurityHealthService.exe
// @exclude         SecurityHealthSystray.exe
// @exclude         smartscreen.exe
// @exclude         SgrmBroker.exe
// @exclude         SearchIndexer.exe
// @exclude         SearchProtocolHost.exe
// @exclude         SearchFilterHost.exe
// @exclude         SearchHost.exe
// @exclude         SearchApp.exe
// @exclude         StartMenuExperienceHost.exe
// @exclude         ShellExperienceHost.exe
// @exclude         ShellHost.exe
// @exclude         TextInputHost.exe
// @exclude         Widgets.exe
// @exclude         WidgetService.exe
// @exclude         msedgewebview2.exe
// @exclude         TrustedInstaller.exe
// @exclude         TiWorker.exe
// @exclude         MoUsoCoreWorker.exe
// @exclude         EasyAntiCheat*.exe
// @exclude         start_protected_game.exe
// @exclude         BEService*.exe
// @exclude         BEClient*.exe
// @exclude         vgc.exe
// @exclude         vgtray.exe
// @exclude         VALORANT*.exe
// @exclude         RiotClient*.exe
// @exclude         LeagueClient*.exe
// @exclude         League of Legends.exe
// @exclude         cs2.exe
// @exclude         csgo.exe
// @exclude         r5apex*.exe
// @exclude         FortniteClient*.exe
// @exclude         cod.exe
// @exclude         ModernWarfare.exe
// @exclude         BlackOps*.exe
// @exclude         Overwatch.exe
// @exclude         GenshinImpact.exe
// @exclude         StarRail.exe
// @exclude         ZenlessZoneZero.exe
// @exclude         FACEIT*.exe
// @exclude         TslGame.exe
// @exclude         RainbowSix*.exe
// @exclude         destiny2.exe
// @exclude         EscapeFromTarkov.exe
// @compilerOptions -lwinhttp
// ==/WindhawkMod==

// ==WindhawkModReadme==
/*
# Ask LumaBrowser about this window

Adds **Ask Luma about this window** to the window menu of other apps' windows
(right-click a title bar, press Alt+Space, or click the app icon in the top left
corner). Choosing it makes [LumaBrowser](https://lumabyte.com) read that window
(its title, the app, its readable text through UI Automation and a screenshot)
and open a new chat with them attached, under your prompt.

Optionally, a hotkey asks about the window in front.

## Requirements

- LumaBrowser running, with Settings > API on and Settings > Extensions >
  Desktop Integration on, with its **Ask about a window** feature switched on.
- Windows 10 or 11.

## How it works

The mod only adds a menu item and sends the window handle to Luma
(`POST /api/desktop/ask/window` on Luma's local Desktop Integration API, in the
background). Luma does the reading and the screenshot itself, so nothing about
the window passes through the mod. When Luma is not running the item is hidden
(or, with "Show only while Luma is running" off, choosing it just beeps) and
the menu is otherwise untouched.

Luma refuses windows it must not read: apps running as administrator, Windows
sign-in and UAC prompts, anti-cheat protected games, minimized windows. It
tells you why in a Windows notification.

## Where the item appears

In apps whose title bar uses the standard Windows window menu: most desktop
apps, File Explorer, Notepad, Office, Chromium browsers and Electron apps
(Alt+Space), and Store apps. Apps that draw a menu of their own on title bar
right-click (some browsers on the tab strip) show it on Alt+Space instead.
Games, console windows and system processes are skipped (see the exclusion
list in the mod header and the "Also skip these programs" setting).

## Why no title bar button

A real button beside minimize / maximize / close is not reliable on Windows 11:
the caption buttons are drawn by DWM (or by the app itself in Chromium,
Electron, Office, Store and WinUI apps), there is no API to add one, and
painting into the non-client area breaks Mica, snap layouts and custom title
bars. A floating overlay window per app window would have to follow every move,
resize, DPI change and z-order change in every process. The window menu works
everywhere the standard frame does and costs nothing until it opens.

## Hotkey

Set "Hotkey" (for example `Ctrl+Alt+A`). It is registered once, in Explorer,
and asks about whatever window is in front. Luma also offers its own hotkey
setting (Settings > Extensions > Desktop Integration > Ask about a window),
which works without this mod; use one or the other.
*/
// ==/WindhawkModReadme==

// ==WindhawkModSettings==
/*
- menuLabel: Ask Luma about this window
  $name: Menu item text
- mode: default
  $name: What Luma reads
  $options:
  - default: Luma's setting
  - both: Text and screenshot
  - text: Text only
  - screenshot: Screenshot only
- prompt: ""
  $name: Prompt
  $description: Put in Luma's chat composer. Empty uses Luma's default prompt.
- autoSend: default
  $name: Send right away
  $options:
  - default: Luma's setting
  - on: "Yes"
  - off: "No, leave it in the composer"
- onlyWhenLumaRunning: true
  $name: Show only while Luma is running
  $description: Hide the menu item while Luma (or its Ask feature) is off.
- skipElevated: true
  $name: Skip apps running as administrator
  $description: Luma cannot read them, so the item is not added there.
- hotkey: ""
  $name: Hotkey
  $description: >-
    Asks about the window in front, e.g. Ctrl+Alt+A or Win+Shift+L (Ctrl, Alt,
    Shift, Win plus a letter, digit, F1 to F24 or Space). Empty for none.
- excludedProcesses: ""
  $name: Also skip these programs
  $description: >-
    Program file names separated by commas, e.g. game.exe, tool.exe. Applies
    to programs started after the change.
- apiKey: ""
  $name: Luma API key
  $description: >-
    Only needed when Luma's Settings > API requires an API key. Leave empty
    otherwise.
- timeoutMs: 20000
  $name: Request timeout (ms)
  $description: >-
    How long to wait for Luma's answer (reading a large window can take a few
    seconds). Runs in the background either way.
*/
// ==/WindhawkModSettings==

// BEGIN luma_client v1 (canonical copy: integrations/windhawk/_shared/luma_client.inc.cpp in the LumaBrowser repo;
// paste it verbatim between these markers, never edit a copy in place)
//
// A minimal, dependency-free client for LumaBrowser's Desktop Integration API, safe inside explorer.exe:
// - discovery: reads %USERPROFILE%\.lumabrowser\desktop.json (or %LUMA_DESKTOP_HANDSHAKE%), re-read whenever its
//   modification time changes, so Luma restarts and token rotations need nothing from the mod;
// - WinHTTP GET/POST of JSON to http://127.0.0.1:<port><apiBase><path> with the token and X-Luma-Client headers,
//   short timeouts, never throws, returns { status, body };
// - async helpers that run on the Windows thread pool (never on a UI thread) and pin the mod DLL until the callback
//   returns, plus luma::Shutdown() for Wh_ModUninit that cancels requests in flight and waits for them;
// - tiny JSON helpers: read a top-level string, integer, boolean or raw value; escape a string for a request body.
// Link with -lwinhttp (in the mod's @compilerOptions).

#include <windows.h>
#include <winhttp.h>

#include <atomic>
#include <functional>
#include <mutex>
#include <set>
#include <string>
#include <string_view>

namespace luma {

struct Config {
    // Sent as X-Luma-Client: "<name>/<version>", e.g. L"windhawk-luma-glance/1.0".
    std::wstring clientName;
    DWORD connectTimeoutMs = 500;
    // Upper bound for sending the request and for receiving the response.
    DWORD totalTimeoutMs = 3000;
    // Only needed when Luma's Settings > API requires an API key; sent as X-API-Key.
    std::wstring apiKey;
    // Empty: %LUMA_DESKTOP_HANDSHAKE%, else %USERPROFILE%\.lumabrowser\desktop.json.
    std::wstring handshakePath;
};

struct Handshake {
    bool ok = false;
    int port = 0;
    DWORD pid = 0;
    std::string token;
    std::string apiBase;
    std::string version;
    // The raw JSON array of enabled feature ids, e.g. ["ping","glance"].
    std::string featuresJson;
};

struct Response {
    // HTTP status, or 0 when no response arrived (Luma not running, timeout, canceled).
    int status = 0;
    std::string body;
    // The Win32 or WinHTTP error code when status is 0.
    DWORD error = 0;
    bool ok() const { return status >= 200 && status < 300; }
};

using Callback = std::function<void(const Response&)>;

namespace json {

inline size_t SkipWs(std::string_view s, size_t i) {
    while (i < s.size() && (s[i] == ' ' || s[i] == '\t' || s[i] == '\r' || s[i] == '\n')) i++;
    return i;
}

inline void AppendUtf8(std::string& out, unsigned cp) {
    if (cp < 0x80) {
        out += static_cast<char>(cp);
    } else if (cp < 0x800) {
        out += static_cast<char>(0xC0 | (cp >> 6));
        out += static_cast<char>(0x80 | (cp & 0x3F));
    } else if (cp < 0x10000) {
        out += static_cast<char>(0xE0 | (cp >> 12));
        out += static_cast<char>(0x80 | ((cp >> 6) & 0x3F));
        out += static_cast<char>(0x80 | (cp & 0x3F));
    } else {
        out += static_cast<char>(0xF0 | (cp >> 18));
        out += static_cast<char>(0x80 | ((cp >> 12) & 0x3F));
        out += static_cast<char>(0x80 | ((cp >> 6) & 0x3F));
        out += static_cast<char>(0x80 | (cp & 0x3F));
    }
}

inline bool Hex4(std::string_view s, size_t i, unsigned* out) {
    if (i + 4 > s.size()) return false;
    unsigned v = 0;
    for (size_t k = 0; k < 4; k++) {
        char c = s[i + k];
        v <<= 4;
        if (c >= '0' && c <= '9') v |= c - '0';
        else if (c >= 'a' && c <= 'f') v |= c - 'a' + 10;
        else if (c >= 'A' && c <= 'F') v |= c - 'A' + 10;
        else return false;
    }
    *out = v;
    return true;
}

// Parses the JSON string starting at s[i] == '"'. On success *end is just past the closing quote.
inline bool ParseString(std::string_view s, size_t i, std::string* out, size_t* end) {
    if (i >= s.size() || s[i] != '"') return false;
    std::string value;
    for (i++; i < s.size(); i++) {
        char c = s[i];
        if (c == '"') {
            if (out) *out = std::move(value);
            if (end) *end = i + 1;
            return true;
        }
        if (c != '\\') { value += c; continue; }
        if (++i >= s.size()) return false;
        switch (s[i]) {
            case '"': value += '"'; break;
            case '\\': value += '\\'; break;
            case '/': value += '/'; break;
            case 'b': value += '\b'; break;
            case 'f': value += '\f'; break;
            case 'n': value += '\n'; break;
            case 'r': value += '\r'; break;
            case 't': value += '\t'; break;
            case 'u': {
                unsigned cp = 0;
                if (!Hex4(s, i + 1, &cp)) return false;
                i += 4;
                if (cp >= 0xD800 && cp <= 0xDBFF && i + 6 < s.size() && s[i + 1] == '\\' && s[i + 2] == 'u') {
                    unsigned lo = 0;
                    if (Hex4(s, i + 3, &lo) && lo >= 0xDC00 && lo <= 0xDFFF) {
                        cp = 0x10000 + ((cp - 0xD800) << 10) + (lo - 0xDC00);
                        i += 6;
                    }
                }
                AppendUtf8(value, cp);
                break;
            }
            default: return false;
        }
    }
    return false;
}

// The end of the value starting at s[i] (string, number, literal, object or array), or npos when malformed.
inline size_t SkipValue(std::string_view s, size_t i) {
    i = SkipWs(s, i);
    if (i >= s.size()) return std::string_view::npos;
    if (s[i] == '"') {
        size_t end = 0;
        return ParseString(s, i, nullptr, &end) ? end : std::string_view::npos;
    }
    if (s[i] == '{' || s[i] == '[') {
        int depth = 0;
        for (; i < s.size(); i++) {
            char c = s[i];
            if (c == '"') {
                size_t end = 0;
                if (!ParseString(s, i, nullptr, &end)) return std::string_view::npos;
                i = end - 1;
            } else if (c == '{' || c == '[') {
                depth++;
            } else if (c == '}' || c == ']') {
                if (--depth == 0) return i + 1;
            }
        }
        return std::string_view::npos;
    }
    while (i < s.size() && s[i] != ',' && s[i] != '}' && s[i] != ']' && s[i] != ' ' && s[i] != '\r' && s[i] != '\n' && s[i] != '\t') i++;
    return i;
}

// Where the value of a top-level key of the object `s` starts, or npos.
inline size_t FindKey(std::string_view s, std::string_view key) {
    size_t i = SkipWs(s, 0);
    if (i >= s.size() || s[i] != '{') return std::string_view::npos;
    i++;
    while (true) {
        i = SkipWs(s, i);
        if (i >= s.size() || s[i] == '}') return std::string_view::npos;
        std::string name;
        size_t end = 0;
        if (!ParseString(s, i, &name, &end)) return std::string_view::npos;
        i = SkipWs(s, end);
        if (i >= s.size() || s[i] != ':') return std::string_view::npos;
        size_t valueStart = SkipWs(s, i + 1);
        if (name == key) return valueStart;
        i = SkipValue(s, valueStart);
        if (i == std::string_view::npos) return i;
        i = SkipWs(s, i);
        if (i < s.size() && s[i] == ',') i++;
    }
}

inline bool GetString(std::string_view s, std::string_view key, std::string* out) {
    size_t at = FindKey(s, key);
    return at != std::string_view::npos && ParseString(s, at, out, nullptr);
}

inline bool GetInt(std::string_view s, std::string_view key, long long* out) {
    size_t at = FindKey(s, key);
    if (at == std::string_view::npos || at >= s.size()) return false;
    bool negative = s[at] == '-';
    size_t i = negative ? at + 1 : at;
    if (i >= s.size() || s[i] < '0' || s[i] > '9') return false;
    long long v = 0;
    for (; i < s.size() && s[i] >= '0' && s[i] <= '9'; i++) {
        if (v > 922337203685477580LL) return false;
        v = v * 10 + (s[i] - '0');
    }
    if (out) *out = negative ? -v : v;
    return true;
}

inline bool GetBool(std::string_view s, std::string_view key, bool* out) {
    size_t at = FindKey(s, key);
    if (at == std::string_view::npos) return false;
    if (s.substr(at, 4) == "true") { if (out) *out = true; return true; }
    if (s.substr(at, 5) == "false") { if (out) *out = false; return true; }
    return false;
}

// The raw text of a value (an object or array to search further with the helpers above).
inline bool GetRaw(std::string_view s, std::string_view key, std::string* out) {
    size_t at = FindKey(s, key);
    if (at == std::string_view::npos) return false;
    size_t end = SkipValue(s, at);
    if (end == std::string_view::npos) return false;
    if (out) out->assign(s.substr(at, end - at));
    return true;
}

// A JSON string literal, quotes included, for building request bodies.
inline std::string Quote(std::string_view value) {
    std::string out = "\"";
    for (unsigned char c : value) {
        switch (c) {
            case '"': out += "\\\""; break;
            case '\\': out += "\\\\"; break;
            case '\n': out += "\\n"; break;
            case '\r': out += "\\r"; break;
            case '\t': out += "\\t"; break;
            default:
                if (c < 0x20) {
                    static const char* hex = "0123456789abcdef";
                    out += "\\u00";
                    out += hex[c >> 4];
                    out += hex[c & 0xF];
                } else {
                    out += static_cast<char>(c);
                }
        }
    }
    out += '"';
    return out;
}

inline std::string ToUtf8(std::wstring_view w) {
    if (w.empty()) return {};
    int n = WideCharToMultiByte(CP_UTF8, 0, w.data(), static_cast<int>(w.size()), nullptr, 0, nullptr, nullptr);
    std::string out(n > 0 ? n : 0, '\0');
    if (n > 0) WideCharToMultiByte(CP_UTF8, 0, w.data(), static_cast<int>(w.size()), out.data(), n, nullptr, nullptr);
    return out;
}

inline std::wstring FromUtf8(std::string_view s) {
    if (s.empty()) return {};
    int n = MultiByteToWideChar(CP_UTF8, 0, s.data(), static_cast<int>(s.size()), nullptr, 0);
    std::wstring out(n > 0 ? n : 0, L'\0');
    if (n > 0) MultiByteToWideChar(CP_UTF8, 0, s.data(), static_cast<int>(s.size()), out.data(), n);
    return out;
}

// True when the JSON array text (e.g. Handshake::featuresJson) holds the string `id`.
inline bool ArrayHasString(std::string_view arr, std::string_view id) {
    size_t i = SkipWs(arr, 0);
    if (i >= arr.size() || arr[i] != '[') return false;
    for (i++;;) {
        i = SkipWs(arr, i);
        if (i >= arr.size() || arr[i] == ']') return false;
        std::string item;
        size_t end = 0;
        if (arr[i] == '"' && ParseString(arr, i, &item, &end)) {
            if (item == id) return true;
            i = end;
        } else {
            i = SkipValue(arr, i);
            if (i == std::string_view::npos) return false;
        }
        i = SkipWs(arr, i);
        if (i < arr.size() && arr[i] == ',') i++;
    }
}

}  // namespace json

namespace detail {

constexpr size_t kMaxHandshakeBytes = 64 * 1024;
constexpr size_t kMaxBodyBytes = 4 * 1024 * 1024;

struct State {
    std::mutex mutex;
    Config config;
    Handshake handshake;
    FILETIME handshakeTime = {};
    std::wstring handshakeFile;
    HINTERNET session = nullptr;
    std::set<HINTERNET> active;
    std::atomic<bool> shuttingDown{false};
    std::atomic<long> inFlight{0};
};

inline State& S() {
    static State state;
    return state;
}

inline std::wstring Env(const wchar_t* name) {
    wchar_t buf[MAX_PATH * 2];
    DWORD n = GetEnvironmentVariableW(name, buf, ARRAYSIZE(buf));
    return n > 0 && n < ARRAYSIZE(buf) ? std::wstring(buf, n) : std::wstring();
}

inline std::wstring HandshakePathLocked(State& s) {
    if (!s.config.handshakePath.empty()) return s.config.handshakePath;
    std::wstring overridePath = Env(L"LUMA_DESKTOP_HANDSHAKE");
    if (!overridePath.empty()) return overridePath;
    std::wstring home = Env(L"USERPROFILE");
    return home.empty() ? std::wstring() : home + L"\\.lumabrowser\\desktop.json";
}

inline bool ReadFileUtf8(const std::wstring& path, std::string* out) {
    HANDLE h = CreateFileW(path.c_str(), GENERIC_READ, FILE_SHARE_READ | FILE_SHARE_WRITE | FILE_SHARE_DELETE, nullptr,
                           OPEN_EXISTING, FILE_ATTRIBUTE_NORMAL, nullptr);
    if (h == INVALID_HANDLE_VALUE) return false;
    LARGE_INTEGER size = {};
    bool ok = GetFileSizeEx(h, &size) && size.QuadPart > 0 && size.QuadPart <= static_cast<LONGLONG>(kMaxHandshakeBytes);
    if (ok) {
        out->resize(static_cast<size_t>(size.QuadPart));
        DWORD read = 0;
        ok = ReadFile(h, out->data(), static_cast<DWORD>(out->size()), &read, nullptr) && read == out->size();
    }
    CloseHandle(h);
    return ok;
}

inline Handshake Parse(std::string_view text) {
    Handshake hs;
    long long port = 0;
    long long pid = 0;
    if (!json::GetInt(text, "port", &port) || port <= 0 || port > 65535) return hs;
    if (!json::GetString(text, "token", &hs.token) || hs.token.empty()) return hs;
    if (!json::GetString(text, "apiBase", &hs.apiBase) || hs.apiBase.empty()) hs.apiBase = "/api/desktop";
    json::GetString(text, "version", &hs.version);
    if (json::GetInt(text, "pid", &pid) && pid > 0) hs.pid = static_cast<DWORD>(pid);
    if (!json::GetRaw(text, "features", &hs.featuresJson)) hs.featuresJson = "[]";
    hs.port = static_cast<int>(port);
    hs.ok = true;
    return hs;
}

// Re-reads the file only when its modification time changed.
inline Handshake CurrentHandshake() {
    State& s = S();
    std::lock_guard<std::mutex> lock(s.mutex);
    std::wstring path = HandshakePathLocked(s);
    WIN32_FILE_ATTRIBUTE_DATA attrs = {};
    if (path.empty() || !GetFileAttributesExW(path.c_str(), GetFileExInfoStandard, &attrs)) {
        s.handshake = Handshake();
        s.handshakeTime = {};
        return s.handshake;
    }
    bool changed = path != s.handshakeFile || CompareFileTime(&attrs.ftLastWriteTime, &s.handshakeTime) != 0 || !s.handshake.ok;
    if (changed) {
        std::string text;
        s.handshake = ReadFileUtf8(path, &text) ? Parse(text) : Handshake();
        s.handshakeTime = attrs.ftLastWriteTime;
        s.handshakeFile = path;
    }
    return s.handshake;
}

inline bool ProcessAlive(DWORD pid) {
    if (!pid) return true;
    HANDLE h = OpenProcess(SYNCHRONIZE, FALSE, pid);
    if (!h) return GetLastError() == ERROR_ACCESS_DENIED;
    bool alive = WaitForSingleObject(h, 0) == WAIT_TIMEOUT;
    CloseHandle(h);
    return alive;
}

inline HINTERNET SessionLocked(State& s) {
    if (!s.session) {
        s.session = WinHttpOpen(L"LumaDesktopClient/1", WINHTTP_ACCESS_TYPE_NO_PROXY, WINHTTP_NO_PROXY_NAME, WINHTTP_NO_PROXY_BYPASS, 0);
    }
    return s.session;
}

inline void Track(HINTERNET h) {
    State& s = S();
    std::lock_guard<std::mutex> lock(s.mutex);
    s.active.insert(h);
}

// False when Shutdown already closed the handle to cancel it.
inline bool Untrack(HINTERNET h) {
    State& s = S();
    std::lock_guard<std::mutex> lock(s.mutex);
    return s.active.erase(h) > 0;
}

inline std::wstring DefaultClientName() {
#if defined(WH_MOD_ID) && defined(WH_MOD_VERSION)
    return std::wstring(L"windhawk-") + WH_MOD_ID + L"/" + WH_MOD_VERSION;
#else
    return L"luma-desktop-client/1";
#endif
}

inline Response Fail(DWORD error) {
    Response r;
    r.error = error ? error : ERROR_GEN_FAILURE;
    return r;
}

inline Response Send(const wchar_t* method, std::wstring_view path, std::string_view body) {
    State& s = S();
    if (s.shuttingDown) return Fail(ERROR_OPERATION_ABORTED);
    Handshake hs = CurrentHandshake();
    if (!hs.ok) return Fail(ERROR_FILE_NOT_FOUND);
    if (!ProcessAlive(hs.pid)) return Fail(ERROR_NOT_READY);
    Config config;
    HINTERNET session = nullptr;
    {
        std::lock_guard<std::mutex> lock(s.mutex);
        config = s.config;
        session = SessionLocked(s);
    }
    if (!session) return Fail(GetLastError());
    HINTERNET connect = WinHttpConnect(session, L"127.0.0.1", static_cast<INTERNET_PORT>(hs.port), 0);
    if (!connect) return Fail(GetLastError());
    std::wstring fullPath = json::FromUtf8(hs.apiBase) + std::wstring(path);
    HINTERNET request = WinHttpOpenRequest(connect, method, fullPath.c_str(), nullptr, WINHTTP_NO_REFERER, WINHTTP_DEFAULT_ACCEPT_TYPES, 0);
    if (!request) {
        DWORD err = GetLastError();
        WinHttpCloseHandle(connect);
        return Fail(err);
    }
    Track(request);
    Response result;
    WinHttpSetTimeouts(request, 0, static_cast<int>(config.connectTimeoutMs), static_cast<int>(config.totalTimeoutMs), static_cast<int>(config.totalTimeoutMs));
    std::wstring headers = L"Accept: application/json\r\nContent-Type: application/json; charset=utf-8\r\nX-Luma-Desktop-Token: ";
    headers += json::FromUtf8(hs.token);
    headers += L"\r\nX-Luma-Client: ";
    headers += config.clientName.empty() ? DefaultClientName() : config.clientName;
    if (!config.apiKey.empty()) headers += L"\r\nX-API-Key: " + config.apiKey;
    bool sent = WinHttpSendRequest(request, headers.c_str(), static_cast<DWORD>(headers.size()),
                                   body.empty() ? WINHTTP_NO_REQUEST_DATA : const_cast<char*>(body.data()),
                                   static_cast<DWORD>(body.size()), static_cast<DWORD>(body.size()), 0) &&
                WinHttpReceiveResponse(request, nullptr);
    if (sent) {
        DWORD status = 0;
        DWORD size = sizeof(status);
        if (WinHttpQueryHeaders(request, WINHTTP_QUERY_STATUS_CODE | WINHTTP_QUERY_FLAG_NUMBER, WINHTTP_HEADER_NAME_BY_INDEX, &status, &size, WINHTTP_NO_HEADER_INDEX)) {
            result.status = static_cast<int>(status);
        }
        char buf[8192];
        DWORD read = 0;
        while (!s.shuttingDown && WinHttpReadData(request, buf, sizeof(buf), &read) && read > 0) {
            if (result.body.size() + read > kMaxBodyBytes) break;
            result.body.append(buf, read);
        }
    } else {
        result.error = GetLastError();
    }
    if (Untrack(request)) WinHttpCloseHandle(request);
    WinHttpCloseHandle(connect);
    return result;
}

struct AsyncJob {
    std::wstring method;
    std::wstring path;
    std::string body;
    Callback callback;
    HMODULE pin = nullptr;
};

inline void CALLBACK RunJob(PTP_CALLBACK_INSTANCE instance, void* context) {
    AsyncJob* job = static_cast<AsyncJob*>(context);
    // The mod DLL stays loaded until this callback has returned, even if Windhawk unloads the mod meanwhile.
    if (job->pin) FreeLibraryWhenCallbackReturns(instance, job->pin);
    try {
        Response r = Send(job->method.c_str(), job->path, job->body);
        if (!S().shuttingDown && job->callback) job->callback(r);
    } catch (...) {
    }
    delete job;
    S().inFlight--;
}

inline bool Submit(const wchar_t* method, std::wstring_view path, std::string_view body, Callback callback) {
    State& s = S();
    if (s.shuttingDown) return false;
    AsyncJob* job = nullptr;
    try {
        job = new AsyncJob{method, std::wstring(path), std::string(body), std::move(callback), nullptr};
    } catch (...) {
        return false;
    }
    GetModuleHandleExW(GET_MODULE_HANDLE_EX_FLAG_FROM_ADDRESS, reinterpret_cast<LPCWSTR>(&RunJob), &job->pin);
    s.inFlight++;
    if (TrySubmitThreadpoolCallback(RunJob, job, nullptr)) return true;
    s.inFlight--;
    if (job->pin) FreeLibrary(job->pin);
    delete job;
    return false;
}

}  // namespace detail

// Call once from Wh_ModInit (and again from Wh_ModSettingsChanged when settings feed the config).
inline void Configure(const Config& config) {
    try {
        detail::State& s = detail::S();
        std::lock_guard<std::mutex> lock(s.mutex);
        s.config = config;
        s.shuttingDown = false;
    } catch (...) {
    }
}

// The current handshake (cached; re-read when desktop.json changes). ok is false when Luma never ran or the file is
// unreadable.
inline Handshake ReadHandshake() {
    try {
        return detail::CurrentHandshake();
    } catch (...) {
        return Handshake();
    }
}

// Whether Luma is running and has the feature on, from the handshake alone (no request).
inline bool HasFeature(std::string_view featureId) {
    Handshake hs = ReadHandshake();
    return hs.ok && detail::ProcessAlive(hs.pid) && json::ArrayHasString(hs.featuresJson, featureId);
}

// Blocking requests: call them from a worker thread, never from a window procedure or a hooked UI function.
// path is relative to apiBase and starts with '/', e.g. L"/ping/".
inline Response Get(std::wstring_view path) {
    try { return detail::Send(L"GET", path, {}); } catch (...) { return detail::Fail(ERROR_GEN_FAILURE); }
}

inline Response Post(std::wstring_view path, std::string_view jsonBody) {
    try { return detail::Send(L"POST", path, jsonBody); } catch (...) { return detail::Fail(ERROR_GEN_FAILURE); }
}

// Async requests on the thread pool; the callback runs on a pool thread (post a message to your window to touch UI).
// Returns false when the request could not be queued (shutting down, out of memory).
inline bool GetAsync(std::wstring_view path, Callback callback) {
    return detail::Submit(L"GET", path, {}, std::move(callback));
}

inline bool PostAsync(std::wstring_view path, std::string_view jsonBody, Callback callback) {
    return detail::Submit(L"POST", path, jsonBody, std::move(callback));
}

// Lets Luma's window come to the front when the request that follows asks it to (chat handoff, open URL). Call it
// from the process that owns the foreground (explorer.exe does) right before the request.
inline bool AllowForeground() {
    Handshake hs = ReadHandshake();
    return hs.ok && hs.pid && AllowSetForegroundWindow(hs.pid);
}

// Call from Wh_ModUninit: stops new requests, cancels the ones in flight and waits (bounded) for their callbacks.
inline void Shutdown(DWORD waitMs = 4000) {
    detail::State& s = detail::S();
    s.shuttingDown = true;
    {
        std::lock_guard<std::mutex> lock(s.mutex);
        for (HINTERNET h : s.active) WinHttpCloseHandle(h);
        s.active.clear();
    }
    for (DWORD waited = 0; s.inFlight > 0 && waited < waitMs; waited += 20) Sleep(20);
    std::lock_guard<std::mutex> lock(s.mutex);
    if (s.session) {
        WinHttpCloseHandle(s.session);
        s.session = nullptr;
    }
}

}  // namespace luma
// END luma_client


// ---- mod ----
//
// The item is added to the window menu (the "system menu") from a DefWindowProcW/A hook, the same technique other
// all-process mods use: the window menu is run by DefWindowProc, so the hook sees it open (WM_INITMENUPOPUP with the
// system-menu flag) and sees the item chosen (WM_SYSCOMMAND with our id) without subclassing any window. Only the
// window's own copy of its menu (GetSystemMenu(hwnd, FALSE)) is ever changed, never the desktop's shared default; the
// copy is created just before the menu opens (Alt+Space, a title bar click or right-click, Shift+right-click on the
// taskbar button). Nothing blocks a UI thread: the click posts the hwnd to Luma on the thread pool.

#include <string>
#include <vector>

namespace {

// Window menu command ids must be below 0xF000 and keep the low 4 bits clear (WM_SYSCOMMAND uses them).
constexpr UINT kMenuId = 0x6C50;
constexpr int kHotkeyId = 0x4C41;
constexpr UINT WM_POPUPSYSTEMMENU_ = 0x0313;
constexpr size_t kPruneAt = 256;

struct Settings {
    std::wstring menuLabel = L"Ask Luma about this window";
    std::string mode;        // empty: Luma's setting
    std::string prompt;      // UTF-8, empty: Luma's default
    int autoSend = -1;       // -1 Luma's setting, 0 off, 1 on
    bool onlyWhenLumaRunning = true;
    bool skipElevated = true;
    std::wstring hotkey;
    std::wstring excluded;
};

std::mutex g_mutex;
Settings g_settings;
std::set<HWND> g_touched;  // windows whose menu copy holds our item, to clean up in Wh_ModUninit
std::atomic<bool> g_active{false};
std::wstring g_exeName;    // lower case

HANDLE g_hotkeyThread = nullptr;
DWORD g_hotkeyThreadId = 0;
std::wstring g_hotkeyRegistered;

using DefWindowProc_t = LRESULT(WINAPI*)(HWND, UINT, WPARAM, LPARAM);
DefWindowProc_t DefWindowProcW_orig = nullptr;
DefWindowProc_t DefWindowProcA_orig = nullptr;

std::wstring Lower(std::wstring s) {
    for (auto& c : s) c = static_cast<wchar_t>(towlower(c));
    return s;
}

std::wstring Trim(const std::wstring& s) {
    size_t a = s.find_first_not_of(L" \t\r\n");
    if (a == std::wstring::npos) return L"";
    size_t b = s.find_last_not_of(L" \t\r\n");
    return s.substr(a, b - a + 1);
}

std::wstring StringSetting(PCWSTR name) {
    PCWSTR value = Wh_GetStringSetting(name);
    std::wstring out = value ? value : L"";
    if (value) Wh_FreeStringSetting(value);
    return out;
}

Settings ReadSettings() {
    Settings s;
    std::wstring label = Trim(StringSetting(L"menuLabel"));
    if (!label.empty()) s.menuLabel = label.substr(0, 120);
    std::wstring mode = StringSetting(L"mode");
    if (mode == L"both" || mode == L"text" || mode == L"screenshot") s.mode = luma::json::ToUtf8(mode);
    s.prompt = luma::json::ToUtf8(Trim(StringSetting(L"prompt")));
    std::wstring autoSend = StringSetting(L"autoSend");
    s.autoSend = autoSend == L"on" ? 1 : autoSend == L"off" ? 0 : -1;
    s.onlyWhenLumaRunning = Wh_GetIntSetting(L"onlyWhenLumaRunning") != 0;
    s.skipElevated = Wh_GetIntSetting(L"skipElevated") != 0;
    s.hotkey = Trim(StringSetting(L"hotkey"));
    s.excluded = Lower(StringSetting(L"excludedProcesses"));
    return s;
}

void ConfigureClient() {
    luma::Config config;
    config.clientName = L"windhawk-luma-ask-window/1.0";
    config.totalTimeoutMs = 20000;
    int timeout = Wh_GetIntSetting(L"timeoutMs");
    if (timeout >= 1000 && timeout <= 120000) config.totalTimeoutMs = static_cast<DWORD>(timeout);
    config.apiKey = StringSetting(L"apiKey");
    luma::Configure(config);
}

Settings CurrentSettings() {
    std::lock_guard<std::mutex> lock(g_mutex);
    return g_settings;
}

std::wstring ExeName() {
    wchar_t path[MAX_PATH * 2];
    DWORD n = GetModuleFileNameW(nullptr, path, ARRAYSIZE(path));
    if (!n || n >= ARRAYSIZE(path)) return L"";
    std::wstring full(path, n);
    size_t slash = full.find_last_of(L"\\/");
    return Lower(slash == std::wstring::npos ? full : full.substr(slash + 1));
}

// The comma or semicolon separated list holds `exe` (both lower case).
bool ListHas(const std::wstring& list, const std::wstring& exe) {
    size_t start = 0;
    while (start <= list.size()) {
        size_t end = list.find_first_of(L",;\n", start);
        if (end == std::wstring::npos) end = list.size();
        if (Trim(list.substr(start, end - start)) == exe) return true;
        start = end + 1;
    }
    return false;
}

bool ProcessIsElevated() {
    HANDLE token = nullptr;
    if (!OpenProcessToken(GetCurrentProcess(), TOKEN_QUERY, &token)) return false;
    TOKEN_ELEVATION elevation = {};
    DWORD size = 0;
    bool elevated = GetTokenInformation(token, TokenElevation, &elevation, sizeof(elevation), &size) && elevation.TokenIsElevated;
    CloseHandle(token);
    return elevated;
}

bool IsTopLevel(HWND hwnd) {
    return hwnd && GetAncestor(hwnd, GA_ROOT) == hwnd && !(GetWindowLongPtrW(hwnd, GWL_STYLE) & WS_CHILD);
}

bool ShouldShow(const Settings& s) {
    return !s.onlyWhenLumaRunning || luma::HasFeature("ask");
}

void Remember(HWND hwnd) {
    std::lock_guard<std::mutex> lock(g_mutex);
    if (g_touched.size() >= kPruneAt) {
        for (auto it = g_touched.begin(); it != g_touched.end();) it = IsWindow(*it) ? std::next(it) : g_touched.erase(it);
    }
    g_touched.insert(hwnd);
}

// Adds (or relabels) our item in `menu`, just above the separator before Close; removes it when show is false.
void EnsureItem(HWND hwnd, HMENU menu, bool show, const std::wstring& label) {
    if (!menu || !IsMenu(menu)) return;
    bool present = GetMenuState(menu, kMenuId, MF_BYCOMMAND) != static_cast<UINT>(-1);
    if (!show) {
        if (present) DeleteMenu(menu, kMenuId, MF_BYCOMMAND);
        return;
    }
    if (present) {
        ModifyMenuW(menu, kMenuId, MF_BYCOMMAND | MF_STRING, kMenuId, label.c_str());
        return;
    }
    int count = GetMenuItemCount(menu);
    if (count < 0) return;
    int pos = count;
    for (int i = 0; i < count; i++) {
        if (GetMenuItemID(menu, i) == SC_CLOSE) {
            pos = i;
            if (i > 0 && (GetMenuState(menu, i - 1, MF_BYPOSITION) & MF_SEPARATOR)) pos = i - 1;
            break;
        }
    }
    if (InsertMenuW(menu, static_cast<UINT>(pos), MF_BYPOSITION | MF_STRING, kMenuId, label.c_str())) Remember(hwnd);
}

// Before the window menu opens: make sure the window has its own copy of the menu, holding our item.
void PrepareMenu(HWND hwnd) {
    if (!g_active || !IsTopLevel(hwnd) || !(GetWindowLongPtrW(hwnd, GWL_STYLE) & WS_SYSMENU)) return;
    Settings s = CurrentSettings();
    HMENU own = GetSystemMenu(hwnd, FALSE);
    EnsureItem(hwnd, own, ShouldShow(s), s.menuLabel);
}

// The window menu is opening (WM_INITMENUPOPUP): only the window's own copy is changed. systemFlag: Windows
// itself is showing it; otherwise the app shows it with TrackPopupMenu (Chromium, Electron, Windows Terminal do on
// Alt+Space), and it is only touched when it is that window's existing copy.
void OnMenuOpening(HWND hwnd, HMENU menu, bool systemFlag) {
    if (!g_active || !IsTopLevel(hwnd)) return;
    if (!systemFlag && GetMenuState(menu, SC_CLOSE, MF_BYCOMMAND) == static_cast<UINT>(-1)) return;
    Settings s = CurrentSettings();
    bool show = ShouldShow(s);
    HMENU own = GetSystemMenu(hwnd, FALSE);
    if (own != menu) {
        // The desktop's shared menu is showing (the copy did not exist yet): leave it alone, the copy shows next time.
        if (systemFlag) EnsureItem(hwnd, own, show, s.menuLabel);
        return;
    }
    EnsureItem(hwnd, menu, show, s.menuLabel);
}

void Ask(HWND target, PCWSTR why) {
    Settings s = CurrentSettings();
    std::string body = "{\"hwnd\":" + std::to_string(static_cast<unsigned long long>(reinterpret_cast<ULONG_PTR>(target)));
    if (!s.mode.empty()) body += ",\"mode\":" + luma::json::Quote(s.mode);
    if (!s.prompt.empty()) body += ",\"prompt\":" + luma::json::Quote(s.prompt);
    if (s.autoSend >= 0) body += s.autoSend ? ",\"autoSend\":true" : ",\"autoSend\":false";
    body += "}";
    // This process owns the foreground (the user just used its menu or hotkey): let Luma's window come forward.
    luma::AllowForeground();
    bool queued = luma::PostAsync(L"/ask/window", body, [](const luma::Response& r) {
        if (!r.status) {
            Wh_Log(L"ask: Luma did not answer (error %u)", r.error);
            MessageBeep(MB_ICONWARNING);
            return;
        }
        std::string error;
        if (!r.ok() && luma::json::GetString(r.body, "error", &error)) Wh_Log(L"ask: HTTP %d: %s", r.status, luma::json::FromUtf8(error).c_str());
        else Wh_Log(L"ask: HTTP %d", r.status);
    });
    if (!queued) Wh_Log(L"ask (%s): could not be queued", why);
}

LRESULT HandleDefWindowProc(DefWindowProc_t orig, HWND hwnd, UINT msg, WPARAM wParam, LPARAM lParam) {
    if (g_active) {
        switch (msg) {
            case WM_SYSCOMMAND: {
                UINT cmd = static_cast<UINT>(wParam & 0xFFF0);
                if (cmd == kMenuId) {
                    HWND root = GetAncestor(hwnd, GA_ROOT);
                    Ask(root ? root : hwnd, L"menu");
                    return 0;
                }
                if (cmd == SC_KEYMENU || cmd == SC_MOUSEMENU) PrepareMenu(hwnd);
                break;
            }
            case WM_CONTEXTMENU: {
                // DefWindowProc shows the window menu for a right-click on the caption or the icon.
                if (reinterpret_cast<HWND>(wParam) == hwnd && lParam != -1) {
                    LRESULT hit = SendMessageW(hwnd, WM_NCHITTEST, 0, lParam);
                    if (hit == HTCAPTION || hit == HTSYSMENU) PrepareMenu(hwnd);
                }
                break;
            }
            case WM_POPUPSYSTEMMENU_:
                PrepareMenu(hwnd);
                break;
            case WM_INITMENUPOPUP: {
                LRESULT result = orig(hwnd, msg, wParam, lParam);
                OnMenuOpening(hwnd, reinterpret_cast<HMENU>(wParam), HIWORD(lParam) != 0);
                return result;
            }
        }
    }
    return orig(hwnd, msg, wParam, lParam);
}

LRESULT WINAPI DefWindowProcW_hook(HWND hwnd, UINT msg, WPARAM wParam, LPARAM lParam) {
    return HandleDefWindowProc(DefWindowProcW_orig, hwnd, msg, wParam, lParam);
}

LRESULT WINAPI DefWindowProcA_hook(HWND hwnd, UINT msg, WPARAM wParam, LPARAM lParam) {
    return HandleDefWindowProc(DefWindowProcA_orig, hwnd, msg, wParam, lParam);
}

// ---- hotkey (Explorer only: a global hotkey can be registered by one process, and Explorer always runs) ----

// "Ctrl+Alt+A" -> modifiers and a virtual key; false when it is not a supported combination.
bool ParseHotkey(const std::wstring& text, UINT* mods, UINT* vk) {
    *mods = 0;
    *vk = 0;
    size_t start = 0;
    while (start <= text.size()) {
        size_t end = text.find(L'+', start);
        if (end == std::wstring::npos) end = text.size();
        std::wstring part = Lower(Trim(text.substr(start, end - start)));
        start = end + 1;
        if (part.empty()) continue;
        if (part == L"ctrl" || part == L"control") *mods |= MOD_CONTROL;
        else if (part == L"alt") *mods |= MOD_ALT;
        else if (part == L"shift") *mods |= MOD_SHIFT;
        else if (part == L"win" || part == L"windows" || part == L"super") *mods |= MOD_WIN;
        else if (part == L"space") *vk = VK_SPACE;
        else if (part.size() == 1 && ((part[0] >= L'a' && part[0] <= L'z') || (part[0] >= L'0' && part[0] <= L'9'))) *vk = towupper(part[0]);
        else if (part.size() >= 2 && part.size() <= 3 && part[0] == L'f') {
            int n = _wtoi(part.c_str() + 1);
            if (n < 1 || n > 24) return false;
            *vk = VK_F1 + n - 1;
        } else {
            return false;
        }
    }
    return *mods && *vk;
}

bool IsShellSurface(HWND hwnd) {
    wchar_t cls[64] = {};
    GetClassNameW(hwnd, cls, ARRAYSIZE(cls));
    return !wcscmp(cls, L"Shell_TrayWnd") || !wcscmp(cls, L"Shell_SecondaryTrayWnd") || !wcscmp(cls, L"Progman") || !wcscmp(cls, L"WorkerW");
}

struct HotkeyStart {
    UINT mods;
    UINT vk;
    HANDLE ready;
};

DWORD WINAPI HotkeyThread(LPVOID param) {
    HotkeyStart start = *static_cast<HotkeyStart*>(param);
    MSG msg;
    PeekMessageW(&msg, nullptr, WM_USER, WM_USER, PM_NOREMOVE);  // creates the message queue
    bool registered = RegisterHotKey(nullptr, kHotkeyId, start.mods | MOD_NOREPEAT, start.vk);
    if (!registered) Wh_Log(L"hotkey: RegisterHotKey failed (%u): another app may use it", GetLastError());
    SetEvent(start.ready);
    while (GetMessageW(&msg, nullptr, 0, 0) > 0) {
        if (msg.message == WM_HOTKEY && msg.wParam == kHotkeyId && g_active) {
            HWND fg = GetForegroundWindow();
            HWND root = fg ? GetAncestor(fg, GA_ROOT) : nullptr;
            if (root && !IsShellSurface(root)) Ask(root, L"hotkey");
        }
    }
    if (registered) UnregisterHotKey(nullptr, kHotkeyId);
    return 0;
}

void StopHotkey() {
    if (!g_hotkeyThread) return;
    PostThreadMessageW(g_hotkeyThreadId, WM_QUIT, 0, 0);
    WaitForSingleObject(g_hotkeyThread, 3000);
    CloseHandle(g_hotkeyThread);
    g_hotkeyThread = nullptr;
    g_hotkeyThreadId = 0;
    g_hotkeyRegistered.clear();
}

void ApplyHotkey(const std::wstring& hotkey) {
    if (g_exeName != L"explorer.exe") return;
    if (g_hotkeyThread && hotkey == g_hotkeyRegistered) return;
    StopHotkey();
    if (hotkey.empty()) return;
    HotkeyStart start = {};
    if (!ParseHotkey(hotkey, &start.mods, &start.vk)) {
        Wh_Log(L"hotkey: \"%s\" is not a supported combination", hotkey.c_str());
        return;
    }
    start.ready = CreateEventW(nullptr, TRUE, FALSE, nullptr);
    if (!start.ready) return;
    g_hotkeyThread = CreateThread(nullptr, 0, HotkeyThread, &start, 0, &g_hotkeyThreadId);
    if (g_hotkeyThread) {
        WaitForSingleObject(start.ready, 3000);
        g_hotkeyRegistered = hotkey;
    }
    CloseHandle(start.ready);
}

void RemoveItems() {
    std::set<HWND> touched;
    {
        std::lock_guard<std::mutex> lock(g_mutex);
        touched.swap(g_touched);
    }
    for (HWND hwnd : touched) {
        if (!IsWindow(hwnd)) continue;
        HMENU menu = GetSystemMenu(hwnd, FALSE);
        if (menu) DeleteMenu(menu, kMenuId, MF_BYCOMMAND);
    }
}

}  // namespace

BOOL Wh_ModInit() {
    g_exeName = ExeName();
    Settings s = ReadSettings();
    if (!s.excluded.empty() && ListHas(s.excluded, g_exeName)) {
        Wh_Log(L"skipped: %s is in the exclusion list", g_exeName.c_str());
        return FALSE;
    }
    if (s.skipElevated && ProcessIsElevated()) {
        Wh_Log(L"skipped: %s runs as administrator", g_exeName.c_str());
        return FALSE;
    }
    {
        std::lock_guard<std::mutex> lock(g_mutex);
        g_settings = s;
    }
    ConfigureClient();
    if (!Wh_SetFunctionHook(reinterpret_cast<void*>(DefWindowProcW), reinterpret_cast<void*>(DefWindowProcW_hook), reinterpret_cast<void**>(&DefWindowProcW_orig)) ||
        !Wh_SetFunctionHook(reinterpret_cast<void*>(DefWindowProcA), reinterpret_cast<void*>(DefWindowProcA_hook), reinterpret_cast<void**>(&DefWindowProcA_orig))) {
        Wh_Log(L"could not hook DefWindowProc");
        return FALSE;
    }
    g_active = true;
    ApplyHotkey(s.hotkey);
    return TRUE;
}

void Wh_ModSettingsChanged() {
    Settings s = ReadSettings();
    {
        std::lock_guard<std::mutex> lock(g_mutex);
        g_settings = s;
    }
    ConfigureClient();
    // A program added to the exclusion list stops showing the item now; it is unhooked when it next starts.
    g_active = s.excluded.empty() || !ListHas(s.excluded, g_exeName);
    if (!g_active) RemoveItems();
    ApplyHotkey(g_active ? s.hotkey : std::wstring());
}

void Wh_ModUninit() {
    g_active = false;
    StopHotkey();
    RemoveItems();
    luma::Shutdown();
}

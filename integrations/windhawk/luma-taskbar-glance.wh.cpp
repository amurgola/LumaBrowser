// ==WindhawkMod==
// @id              luma-taskbar-glance
// @name            LumaBrowser Taskbar Glance
// @description     Shows LumaBrowser's Hub glance (next meeting, unread, tasks due) on the Windows 11 taskbar clock, with details in the clock tooltip
// @version         1.0
// @author          LumaBrowser
// @github          https://github.com/amurgola/LumaBrowser
// @include         explorer.exe
// @architecture    x86-64
// @compilerOptions -lwinhttp -lversion -lole32 -loleaut32 -lruntimeobject
// ==/WindhawkMod==

// Source code is published under The GNU General Public License v3.0.
//
// The clock hooks (the SystemTray symbols, the GetDateFormatEx / GetTimeFormatEx
// gating on the clock refresh, the tooltip hstring rewrite and the registry
// nudge that makes the clock refresh) are adapted from m417z's "Taskbar Clock
// Customization" mod (https://github.com/ramensoftware/windhawk-mods,
// mods/taskbar-clock-customization.wh.cpp, GPL-3.0). The embedded luma_client
// block is LumaBrowser's own.

// ==WindhawkModReadme==
/*
# LumaBrowser Taskbar Glance

Puts one short line from [LumaBrowser](https://lumabyte.com)'s Hub on the
Windows 11 taskbar clock, for example:

`Standup in 12m · 4 unread · 2 due`

- The line comes from Luma's Desktop Integration API
  (`GET /api/desktop/glance/`), polled in the background every 30 seconds by
  default. What it contains (next calendar event, open conversations, tasks
  due, running timed tasks), the separator, the time format and the maximum
  length are set in Luma: Settings > Extensions > Desktop Integration > Glance.
- Hover the clock: the tooltip gets the details (the event's place, the newest
  threads, the tasks due).
- Middle-click the clock: Luma comes to the front on its Dashboard (or the item
  chosen in the settings). A normal click still opens the Windows calendar
  flyout.
- When Luma is not running (or Desktop Integration or its Glance feature is
  off) the clock shows the stock Windows text again, unless you set an offline
  text.

## Requirements

- Windows 11 (version 22H2 or newer; tested target: 24H2).
- LumaBrowser running with Settings > API on and Settings > Extensions >
  Desktop Integration on, with its Glance feature switched on.

## Notes

- Only the clock text changes; the mod applies no XAML styles, so it can run
  next to Windows 11 Taskbar Styler. It does conflict with Taskbar Clock
  Customization when both change the same clock line: use one of them for that
  line (for example, let this mod replace the date line and the other one the
  time line, or turn this one's line off by choosing the tooltip only).
- The clock refreshes its text about once a minute on its own; the mod asks
  for an extra refresh when the glance line changes.
- Debug logging (Windhawk > the mod > Advanced) shows each poll's outcome.
*/
// ==/WindhawkModReadme==

// ==WindhawkModSettings==
/*
- lineMode: replaceDate
  $name: Clock line
  $description: Where the glance line goes on the taskbar clock.
  $options:
  - replaceDate: Replace the date line
  - appendDate: Add it after the date, on the date line
  - thirdLine: Add a third line under the date
  - replaceTime: Replace the time line
  - tooltipOnly: Tooltip only (leave the clock text alone)
- refreshSeconds: 30
  $name: Refresh interval (seconds)
  $description: How often to ask Luma for the glance (10 to 3600).
- maxChars: 40
  $name: Maximum width (characters)
  $description: >-
    The line is shortened with "..." past this many characters (Luma also has
    its own maximum). 0 means no limit.
- offlineText: ""
  $name: Text when Luma is not running
  $description: >-
    Leave empty to show the stock clock text while Luma is closed or its Glance
    feature is off.
- tooltipMode: append
  $name: Tooltip
  $description: What to do with the clock tooltip.
  $options:
  - append: Add the glance details under the date and time
  - replace: Show only the glance details
  - off: Leave the tooltip alone
- clickTarget: hub
  $name: Middle-click opens
  $description: What middle-clicking the clock opens in Luma.
  $options:
  - hub: The Dashboard (Hub)
  - event: The current or next calendar event
  - thread: The newest open conversation
  - task: The first task due
  - off: Nothing (middle-click does nothing)
- apiKey: ""
  $name: Luma API key
  $description: >-
    Only needed when Luma's Settings > API requires an API key. Leave empty
    otherwise.
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

#include <windhawk_utils.h>

#include <vector>

#undef GetCurrentTime

#include <winrt/base.h>
#include <winrt/Windows.Foundation.h>
#include <winrt/Windows.UI.Core.h>
#include <winrt/Windows.UI.Input.h>
#include <winrt/Windows.UI.Xaml.h>
#include <winrt/Windows.UI.Xaml.Input.h>

namespace xaml = winrt::Windows::UI::Xaml;

enum class LineMode { replaceDate, appendDate, thirdLine, replaceTime, tooltipOnly };
enum class TooltipMode { append, replace, off };

constexpr wchar_t kClientName[] = L"windhawk-luma-taskbar-glance/1.0";
constexpr wchar_t kDateSeparator[] = L"  ·  ";
constexpr int kFailuresBeforeOffline = 2;

// ---- state shared between the poll thread and the clock hooks ----

std::atomic<LineMode> g_lineMode{LineMode::replaceDate};
std::atomic<TooltipMode> g_tooltipMode{TooltipMode::append};
std::atomic<int> g_refreshSeconds{30};
std::atomic<int> g_maxChars{40};
std::atomic<bool> g_unloading{false};

std::mutex g_textMutex;
std::wstring g_offlineText;     // guarded by g_textMutex
std::wstring g_clickTarget;     // guarded by g_textMutex; empty = off
std::wstring g_line;            // what the clock shows; empty = stock text
std::wstring g_tooltip;         // the glance details, CRLF separated; empty = none

HANDLE g_stopEvent = nullptr;
HANDLE g_wakeEvent = nullptr;
HANDLE g_pollThread = nullptr;
std::atomic<bool> g_systemTrayHooked{false};

// Set while the clock refreshes its text on this thread (several taskbars refresh on thread-pool threads).
thread_local bool t_inRefreshIcon = false;
thread_local bool t_inTooltip = false;

std::wstring CurrentLine() {
    std::lock_guard<std::mutex> lock(g_textMutex);
    return g_line;
}

std::wstring CurrentTooltip() {
    std::lock_guard<std::mutex> lock(g_textMutex);
    return g_tooltip;
}

// ---- small helpers ----

std::wstring SettingString(PCWSTR name) {
    std::wstring out;
    PCWSTR value = Wh_GetStringSetting(name);
    if (value) {
        out = value;
        Wh_FreeStringSetting(value);
    }
    return out;
}

// One line of text: control characters (newlines included) become spaces, runs of spaces collapse.
std::wstring OneLine(std::wstring_view text) {
    std::wstring out;
    bool space = false;
    for (wchar_t c : text) {
        bool isSpace = c == L' ' || c < 0x20 || c == 0x7F;
        if (isSpace) {
            space = !out.empty();
            continue;
        }
        if (space) out += L' ';
        space = false;
        out += c;
    }
    return out;
}

std::wstring Clip(std::wstring text, int maxChars) {
    if (maxChars <= 0 || static_cast<int>(text.size()) <= maxChars) return text;
    if (maxChars <= 3) return text.substr(0, maxChars);
    text.resize(maxChars - 3);
    while (!text.empty() && text.back() == L' ') text.pop_back();
    return text + L"...";
}

// "\n" separated lines -> "\r\n" separated, other control characters dropped.
std::wstring ToCrLf(std::wstring_view text) {
    std::wstring out;
    for (wchar_t c : text) {
        if (c == L'\r') continue;
        if (c == L'\n') { out += L"\r\n"; continue; }
        if (c < 0x20 && c != L'\t') continue;
        out += c;
    }
    return out;
}

HWND FindCurrentProcessTaskbarWnd() {
    HWND taskbar = nullptr;
    EnumWindows(
        [](HWND hWnd, LPARAM lParam) -> BOOL {
            DWORD processId = 0;
            WCHAR className[32];
            if (GetWindowThreadProcessId(hWnd, &processId) && processId == GetCurrentProcessId() &&
                GetClassNameW(hWnd, className, ARRAYSIZE(className)) && _wcsicmp(className, L"Shell_TrayWnd") == 0) {
                *reinterpret_cast<HWND*>(lParam) = hWnd;
                return FALSE;
            }
            return TRUE;
        },
        reinterpret_cast<LPARAM>(&taskbar));
    return taskbar;
}

// Asks the Windows 11 clock to redraw its text now: touching a value under this key fires the clock's registry
// watcher (the technique of Taskbar Clock Customization). Only the explorer.exe that owns the taskbar does it.
// Never called on a UI thread.
void RefreshClock() {
    if (!FindCurrentProcessTaskbarWnd()) return;
    constexpr WCHAR kTempValueName[] = L"_temp_windhawk_luma-taskbar-glance";
    HKEY key = nullptr;
    if (RegOpenKeyExW(HKEY_CURRENT_USER, L"Control Panel\\TimeDate\\AdditionalClocks", 0, KEY_WRITE, &key) != ERROR_SUCCESS) {
        Wh_Log(L"Could not open the AdditionalClocks key");
        return;
    }
    if (RegSetValueExW(key, kTempValueName, 0, REG_SZ, reinterpret_cast<const BYTE*>(L""), sizeof(WCHAR)) == ERROR_SUCCESS) {
        RegDeleteValueW(key, kTempValueName);
    }
    RegCloseKey(key);
}

// ---- settings ----

void LoadSettings() {
    std::wstring lineMode = SettingString(L"lineMode");
    LineMode mode = LineMode::replaceDate;
    if (lineMode == L"appendDate") mode = LineMode::appendDate;
    else if (lineMode == L"thirdLine") mode = LineMode::thirdLine;
    else if (lineMode == L"replaceTime") mode = LineMode::replaceTime;
    else if (lineMode == L"tooltipOnly") mode = LineMode::tooltipOnly;
    g_lineMode = mode;

    std::wstring tooltipMode = SettingString(L"tooltipMode");
    g_tooltipMode = tooltipMode == L"replace" ? TooltipMode::replace : tooltipMode == L"off" ? TooltipMode::off : TooltipMode::append;

    int refresh = Wh_GetIntSetting(L"refreshSeconds");
    g_refreshSeconds = refresh < 10 ? 10 : refresh > 3600 ? 3600 : refresh;
    int maxChars = Wh_GetIntSetting(L"maxChars");
    g_maxChars = maxChars < 0 ? 0 : maxChars > 200 ? 200 : maxChars;

    std::wstring clickTarget = SettingString(L"clickTarget");
    if (clickTarget != L"event" && clickTarget != L"thread" && clickTarget != L"task" && clickTarget != L"off") clickTarget = L"hub";
    {
        std::lock_guard<std::mutex> lock(g_textMutex);
        g_offlineText = OneLine(SettingString(L"offlineText"));
        g_clickTarget = clickTarget == L"off" ? std::wstring() : clickTarget;
    }

    luma::Config config;
    config.clientName = kClientName;
    config.apiKey = SettingString(L"apiKey");
    luma::Configure(config);
}

// ---- polling (worker thread only) ----

// Fetches the glance; true when Luma answered. line and tooltip stay empty when Luma has nothing to show.
bool FetchGlance(std::wstring* line, std::wstring* tooltip) {
    if (!luma::HasFeature("glance")) return false;
    luma::Response r = luma::Get(L"/glance/");
    if (!r.ok()) {
        Wh_Log(L"glance: HTTP %d, error %u", r.status, r.error);
        return false;
    }
    std::string value;
    if (luma::json::GetString(r.body, "line", &value)) *line = OneLine(luma::json::FromUtf8(value));
    value.clear();
    if (luma::json::GetString(r.body, "tooltip", &value)) *tooltip = ToCrLf(luma::json::FromUtf8(value));
    return true;
}

// Polls once and stores the result; true when the clock text changed.
bool PollOnce(int* failures) {
    std::wstring line;
    std::wstring tooltip;
    bool answered = FetchGlance(&line, &tooltip);
    std::lock_guard<std::mutex> lock(g_textMutex);
    if (!answered) {
        // A busy moment should not flash the stock clock: keep the last line for a couple of polls.
        if (++*failures < kFailuresBeforeOffline && !g_line.empty()) return false;
        line = g_offlineText;
        tooltip.clear();
    } else {
        *failures = 0;
    }
    line = Clip(line, g_maxChars);
    bool changed = line != g_line || tooltip != g_tooltip;
    g_line = std::move(line);
    g_tooltip = std::move(tooltip);
    return changed;
}

DWORD WINAPI PollThread(LPVOID) {
    int failures = 0;
    HANDLE handles[] = {g_stopEvent, g_wakeEvent};
    bool forceRefresh = true;
    while (!g_unloading) {
        // Only the explorer.exe that owns the taskbar polls; other explorer processes (folder windows) stay idle.
        if (FindCurrentProcessTaskbarWnd()) {
            bool changed = PollOnce(&failures);
            if ((changed || forceRefresh) && !g_unloading) RefreshClock();
            forceRefresh = false;
        }
        DWORD wait = WaitForMultipleObjects(2, handles, FALSE, static_cast<DWORD>(g_refreshSeconds) * 1000);
        if (wait == WAIT_OBJECT_0) break;
        if (wait == WAIT_OBJECT_0 + 1) forceRefresh = true;
    }
    return 0;
}

void StartPolling() {
    if (g_pollThread) return;
    g_pollThread = CreateThread(nullptr, 0, PollThread, nullptr, 0, nullptr);
    if (!g_pollThread) Wh_Log(L"Could not start the poll thread: %u", GetLastError());
}

void StopPolling() {
    if (g_stopEvent) SetEvent(g_stopEvent);
    // Cancels a request in flight so the thread sees the stop event at once.
    luma::Shutdown();
    if (g_pollThread) {
        if (WaitForSingleObject(g_pollThread, 10000) != WAIT_OBJECT_0) Wh_Log(L"The poll thread did not stop in time");
        CloseHandle(g_pollThread);
        g_pollThread = nullptr;
    }
}

// ---- middle-click on the clock (XAML, UI thread) ----

struct ClickTarget {
    winrt::weak_ref<xaml::FrameworkElement> element;
    winrt::event_token token;
};

std::mutex g_clickMutex;
std::vector<ClickTarget> g_clickTargets;

void OpenInLuma() {
    std::wstring target;
    {
        std::lock_guard<std::mutex> lock(g_textMutex);
        target = g_clickTarget;
        if (g_line.empty() && g_tooltip.empty()) return;  // Luma is not answering: let the click be.
    }
    if (target.empty()) return;
    luma::AllowForeground();
    std::string body = "{\"target\":" + luma::json::Quote(luma::json::ToUtf8(target)) + "}";
    luma::PostAsync(L"/glance/open", body, [](const luma::Response& r) {
        if (!r.ok()) Wh_Log(L"open: HTTP %d, error %u", r.status, r.error);
    });
}

void OnClockPointerPressed(winrt::Windows::Foundation::IInspectable const& sender, xaml::Input::PointerRoutedEventArgs const& args) {
    try {
        if (g_unloading) return;
        auto element = sender.try_as<xaml::UIElement>();
        if (!element) return;
        auto point = args.GetCurrentPoint(element);
        if (!point.Properties().IsMiddleButtonPressed()) return;
        {
            std::lock_guard<std::mutex> lock(g_textMutex);
            if (g_clickTarget.empty()) return;
        }
        args.Handled(true);
        OpenInLuma();
    } catch (...) {
    }
}

// Adds the middle-click handler to one clock element (once). Runs on the element's UI thread.
void AttachClickHandler(xaml::FrameworkElement const& element) {
    if (g_unloading) return;
    std::lock_guard<std::mutex> lock(g_clickMutex);
    for (auto it = g_clickTargets.begin(); it != g_clickTargets.end();) {
        auto existing = it->element.get();
        if (!existing) {
            it = g_clickTargets.erase(it);
            continue;
        }
        if (existing == element) return;
        ++it;
    }
    winrt::event_token token = element.PointerPressed(xaml::Input::PointerEventHandler(&OnClockPointerPressed));
    g_clickTargets.push_back(ClickTarget{winrt::make_weak(element), token});
    Wh_Log(L"Middle-click handler added to a clock (%zu)", g_clickTargets.size());
}

// Removes every handler on its own UI thread before the mod unloads, so no XAML event calls into a freed DLL.
void DetachClickHandlers() {
    std::vector<ClickTarget> targets;
    {
        std::lock_guard<std::mutex> lock(g_clickMutex);
        targets.swap(g_clickTargets);
    }
    for (auto& target : targets) {
        try {
            auto element = target.element.get();
            if (!element) continue;
            auto dispatcher = element.Dispatcher();
            winrt::event_token token = target.token;
            if (dispatcher.HasThreadAccess()) {
                element.PointerPressed(token);
                continue;
            }
            HANDLE done = CreateEventW(nullptr, TRUE, FALSE, nullptr);
            if (!done) continue;
            dispatcher.RunAsync(winrt::Windows::UI::Core::CoreDispatcherPriority::High, [element, token, done]() {
                try {
                    element.PointerPressed(token);
                } catch (...) {
                }
                SetEvent(done);
            });
            if (WaitForSingleObject(done, 5000) == WAIT_OBJECT_0) {
                CloseHandle(done);
            } else {
                // The UI thread is stuck; leak the event rather than let the late callback signal a closed handle.
                Wh_Log(L"A clock's UI thread did not answer; its handler may stay");
            }
        } catch (...) {
        }
    }
}

bool ClickEnabled() {
    std::lock_guard<std::mutex> lock(g_textMutex);
    return !g_clickTarget.empty();
}

void MaybeAttach(void* pThis) {
    if (g_unloading || !ClickEnabled()) return;
    try {
        winrt::Windows::Foundation::IInspectable obj = nullptr;
        if (FAILED(static_cast<IUnknown*>(pThis)->QueryInterface(winrt::guid_of<winrt::Windows::Foundation::IInspectable>(), winrt::put_abi(obj))) || !obj) return;
        if (winrt::get_class_name(obj) != L"SystemTray.DateTimeIconContent") return;
        auto element = obj.try_as<xaml::FrameworkElement>();
        if (element) AttachClickHandler(element);
    } catch (...) {
    }
}

// ---- clock hooks ----

using RefreshIcon_t = void(WINAPI*)(void* pThis, void* clockUpdate);
RefreshIcon_t RefreshIcon_Original;
RefreshIcon_t RefreshIcon2_Original;

using GetTimeToolTipString_t = void*(WINAPI*)(void* pThis, void*, void*, void*, void*);
GetTimeToolTipString_t GetTimeToolTipString_Original;
GetTimeToolTipString_t GetTimeToolTipString2_Original;
GetTimeToolTipString_t GetTimeToolTipStringB_Original;
GetTimeToolTipString_t GetTimeToolTipStringB2_Original;

using OnApplyTemplate_t = HRESULT(WINAPI*)(void* pThis);
OnApplyTemplate_t DateTimeIconContent_OnApplyTemplate_Original;

using get_ViewModel_t = HRESULT(WINAPI*)(void* pThis, void* pArgs);
get_ViewModel_t BadgeIconContent_get_ViewModel_Original;

decltype(&GetDateFormatEx) GetDateFormatEx_Original;
decltype(&GetTimeFormatEx) GetTimeFormatEx_Original;
decltype(&LoadLibraryExW) LoadLibraryExW_Original;

void RefreshIconImpl(void* pThis, void* clockUpdate, RefreshIcon_t original) {
    t_inRefreshIcon = true;
    original(pThis, clockUpdate);
    t_inRefreshIcon = false;
}

void WINAPI RefreshIcon_Hook(void* pThis, void* clockUpdate) {
    RefreshIconImpl(pThis, clockUpdate, RefreshIcon_Original);
}

void WINAPI RefreshIcon2_Hook(void* pThis, void* clockUpdate) {
    RefreshIconImpl(pThis, clockUpdate, RefreshIcon2_Original);
}

// Rewrites the winrt::hstring the tooltip function returned (layout from C++/WinRT's base_string.h; heap strings
// are allocated on the process heap). Adapted from Taskbar Clock Customization's UpdateToolTipString.
void UpdateToolTipString(void* hstringPtrPtr) {
    TooltipMode mode = g_tooltipMode;
    if (mode == TooltipMode::off || !hstringPtrPtr) return;
    std::wstring extra = CurrentTooltip();
    if (extra.empty()) return;

    struct hstring_header {
        uint32_t flags;
        uint32_t length;
        uint32_t padding1;
        uint32_t padding2;
        wchar_t const* ptr;
    };
    struct shared_hstring_header : hstring_header {
        int32_t count;
        wchar_t buffer[1];
    };

    auto* header = *static_cast<shared_hstring_header**>(hstringPtrPtr);
    if (!header || header->ptr != header->buffer) return;  // not a heap string we know how to grow

    constexpr std::wstring_view separator = L"\r\n\r\n";
    size_t keep = mode == TooltipMode::replace ? 0 : header->length;
    size_t length = keep + (keep ? separator.size() : 0) + extra.size();
    auto* grown = static_cast<shared_hstring_header*>(
        HeapReAlloc(GetProcessHeap(), 0, header, sizeof(shared_hstring_header) + sizeof(wchar_t) * length));
    if (!grown) return;
    grown->ptr = grown->buffer;
    size_t at = keep;
    if (keep) {
        memcpy(grown->buffer + at, separator.data(), sizeof(wchar_t) * separator.size());
        at += separator.size();
    }
    memcpy(grown->buffer + at, extra.data(), sizeof(wchar_t) * extra.size());
    grown->length = static_cast<uint32_t>(length);
    grown->buffer[length] = L'\0';
    *static_cast<shared_hstring_header**>(hstringPtrPtr) = grown;
}

void* TooltipImpl(void* pThis, void* a, void* b, void* c, void* d, GetTimeToolTipString_t original) {
    t_inTooltip = true;
    void* ret = original(pThis, a, b, c, d);
    t_inTooltip = false;
    try {
        UpdateToolTipString(ret);
    } catch (...) {
    }
    return ret;
}

void* WINAPI GetTimeToolTipString_Hook(void* pThis, void* a, void* b, void* c, void* d) {
    return TooltipImpl(pThis, a, b, c, d, GetTimeToolTipString_Original);
}
void* WINAPI GetTimeToolTipString2_Hook(void* pThis, void* a, void* b, void* c, void* d) {
    return TooltipImpl(pThis, a, b, c, d, GetTimeToolTipString2_Original);
}
void* WINAPI GetTimeToolTipStringB_Hook(void* pThis, void* a, void* b, void* c, void* d) {
    return TooltipImpl(pThis, a, b, c, d, GetTimeToolTipStringB_Original);
}
void* WINAPI GetTimeToolTipStringB2_Hook(void* pThis, void* a, void* b, void* c, void* d) {
    return TooltipImpl(pThis, a, b, c, d, GetTimeToolTipStringB2_Original);
}

HRESULT WINAPI DateTimeIconContent_OnApplyTemplate_Hook(void* pThis) {
    HRESULT ret = DateTimeIconContent_OnApplyTemplate_Original(pThis);
    MaybeAttach(pThis);
    return ret;
}

// Called on clock refreshes too, which catches clocks that existed before the mod loaded.
HRESULT WINAPI BadgeIconContent_get_ViewModel_Hook(void* pThis, void* pArgs) {
    HRESULT ret = BadgeIconContent_get_ViewModel_Original(pThis, pArgs);
    MaybeAttach(pThis);
    return ret;
}

// Writes text the way the *FormatEx functions do: with cch 0 the needed size, else the characters copied plus the
// terminator (text longer than the buffer is cut).
int WriteFormatted(const std::wstring& text, LPWSTR out, int cch) {
    int needed = static_cast<int>(text.size()) + 1;
    if (cch <= 0 || !out) return needed;
    int copy = needed <= cch ? static_cast<int>(text.size()) : cch - 1;
    memcpy(out, text.data(), sizeof(wchar_t) * copy);
    out[copy] = L'\0';
    return copy + 1;
}

int WINAPI GetDateFormatEx_Hook(LPCWSTR locale, DWORD flags, const SYSTEMTIME* date, LPCWSTR format, LPWSTR out, int cch, LPCWSTR calendar) {
    if (t_inRefreshIcon && !t_inTooltip && !(flags & DATE_LONGDATE)) {
        LineMode mode = g_lineMode;
        if (mode == LineMode::replaceDate || mode == LineMode::appendDate || mode == LineMode::thirdLine) {
            std::wstring glance = CurrentLine();
            if (!glance.empty()) {
                if (mode == LineMode::replaceDate) return WriteFormatted(glance, out, cch);
                WCHAR stock[256];
                int n = GetDateFormatEx_Original(locale, flags, date, format, stock, ARRAYSIZE(stock), calendar);
                std::wstring text = n > 1 ? std::wstring(stock, n - 1) : std::wstring();
                if (!text.empty()) text += mode == LineMode::thirdLine ? L"\n" : kDateSeparator;
                return WriteFormatted(text + glance, out, cch);
            }
        }
    }
    return GetDateFormatEx_Original(locale, flags, date, format, out, cch, calendar);
}

int WINAPI GetTimeFormatEx_Hook(LPCWSTR locale, DWORD flags, const SYSTEMTIME* time, LPCWSTR format, LPWSTR out, int cch) {
    if (t_inRefreshIcon && !t_inTooltip && g_lineMode == LineMode::replaceTime) {
        std::wstring glance = CurrentLine();
        if (!glance.empty()) return WriteFormatted(glance, out, cch);
    }
    return GetTimeFormatEx_Original(locale, flags, time, format, out, cch);
}

// ---- finding and hooking the system tray module ----

VS_FIXEDFILEINFO* GetModuleVersionInfo(HMODULE module) {
    HRSRC resource = FindResourceW(module, MAKEINTRESOURCEW(VS_VERSION_INFO), RT_VERSION);
    if (!resource) return nullptr;
    HGLOBAL global = LoadResource(module, resource);
    void* data = global ? LockResource(global) : nullptr;
    void* info = nullptr;
    UINT length = 0;
    if (!data || !VerQueryValueW(data, L"\\", &info, &length) || !length) return nullptr;
    return static_cast<VS_FIXEDFILEINFO*>(info);
}

// SystemTray.dll on current builds; Taskbar.View.dll (before 2604) or ExplorerExtensions.dll on older Windows 11.
HMODULE GetSystemTrayModuleHandle() {
    HMODULE module = GetModuleHandleW(L"SystemTray.dll");
    if (!module) {
        module = GetModuleHandleW(L"Taskbar.View.dll");
        if (module) {
            VS_FIXEDFILEINFO* info = GetModuleVersionInfo(module);
            WORD major = info ? HIWORD(info->dwFileVersionMS) : 0;
            if (!major || major >= 2604) module = nullptr;
        }
    }
    if (!module) module = GetModuleHandleW(L"ExplorerExtensions.dll");
    return module;
}

bool HookSystemTraySymbols(HMODULE module) {
    WindhawkUtils::SYMBOL_HOOK hooks[] = {
        {
            {LR"(private: void __cdecl winrt::SystemTray::implementation::ClockSystemTrayIconDataModel::RefreshIcon(class SystemTrayTelemetry::ClockUpdate &))"},
            &RefreshIcon_Original,
            RefreshIcon_Hook,
        },
        {
            {LR"(private: void __cdecl winrt::SystemTray::implementation::ClockSystemTrayIconDataModel2::RefreshIcon(class SystemTrayTelemetry::ClockUpdate &))"},
            &RefreshIcon2_Original,
            RefreshIcon2_Hook,
            true,
        },
        {
            {LR"(private: struct winrt::hstring __cdecl winrt::SystemTray::implementation::ClockSystemTrayIconDataModel::GetTimeToolTipString(struct _SYSTEMTIME const &,struct _SYSTEMTIME const &,class SystemTrayTelemetry::ClockUpdate &))"},
            &GetTimeToolTipString_Original,
            GetTimeToolTipString_Hook,
            true,
        },
        {
            {LR"(private: struct winrt::hstring __cdecl winrt::SystemTray::implementation::ClockSystemTrayIconDataModel2::GetTimeToolTipString(struct _SYSTEMTIME const &,struct _SYSTEMTIME const &,class SystemTrayTelemetry::ClockUpdate &))"},
            &GetTimeToolTipString2_Original,
            GetTimeToolTipString2_Hook,
            true,
        },
        {
            {LR"(private: struct winrt::hstring __cdecl winrt::SystemTray::implementation::ClockSystemTrayIconDataModel::GetTimeToolTipString2(struct _SYSTEMTIME const &,struct _SYSTEMTIME const &,class SystemTrayTelemetry::ClockUpdate &))"},
            &GetTimeToolTipStringB_Original,
            GetTimeToolTipStringB_Hook,
            true,
        },
        {
            {LR"(private: struct winrt::hstring __cdecl winrt::SystemTray::implementation::ClockSystemTrayIconDataModel2::GetTimeToolTipString2(struct _SYSTEMTIME const &,struct _SYSTEMTIME const &,class SystemTrayTelemetry::ClockUpdate &))"},
            &GetTimeToolTipStringB2_Original,
            GetTimeToolTipStringB2_Hook,
            true,
        },
        {
            {LR"(public: virtual int __cdecl winrt::impl::produce<struct winrt::SystemTray::implementation::DateTimeIconContent,struct winrt::Windows::UI::Xaml::IFrameworkElementOverrides>::OnApplyTemplate(void))"},
            &DateTimeIconContent_OnApplyTemplate_Original,
            DateTimeIconContent_OnApplyTemplate_Hook,
            true,
        },
        {
            {LR"(public: virtual int __cdecl winrt::impl::produce<struct winrt::SystemTray::implementation::BadgeIconContent,struct winrt::SystemTray::IBadgeIconContent>::get_ViewModel(void * *))"},
            &BadgeIconContent_get_ViewModel_Original,
            BadgeIconContent_get_ViewModel_Hook,
            true,
        },
    };
    if (!WindhawkUtils::HookSymbols(module, hooks, ARRAYSIZE(hooks))) {
        Wh_Log(L"HookSymbols failed: the clock is left alone");
        return false;
    }
    return true;
}

void HookSystemTrayIfLoaded(HMODULE module) {
    if (!module || g_systemTrayHooked || GetSystemTrayModuleHandle() != module) return;
    if (g_systemTrayHooked.exchange(true)) return;
    Wh_Log(L"System tray module loaded");
    if (HookSystemTraySymbols(module)) Wh_ApplyHookOperations();
}

HMODULE WINAPI LoadLibraryExW_Hook(LPCWSTR fileName, HANDLE file, DWORD flags) {
    HMODULE module = LoadLibraryExW_Original(fileName, file, flags);
    if (module && !g_systemTrayHooked) HookSystemTrayIfLoaded(module);
    return module;
}

// ---- Windhawk entry points ----

BOOL Wh_ModInit() {
    Wh_Log(L"Init");
    LoadSettings();

    g_stopEvent = CreateEventW(nullptr, TRUE, FALSE, nullptr);
    g_wakeEvent = CreateEventW(nullptr, FALSE, FALSE, nullptr);
    if (!g_stopEvent || !g_wakeEvent) return FALSE;

    if (HMODULE module = GetSystemTrayModuleHandle()) {
        // Marked as attempted even when the symbols are missing, so module loads do not retry the lookup.
        g_systemTrayHooked = true;
        HookSystemTraySymbols(module);
    } else {
        Wh_Log(L"System tray module not loaded yet");
    }

    // Use kernelbase's exports, not kernel32's forwarding stubs.
    HMODULE kernelBase = GetModuleHandleW(L"kernelbase.dll");
    auto pLoadLibraryExW = reinterpret_cast<decltype(&LoadLibraryExW)>(GetProcAddress(kernelBase, "LoadLibraryExW"));
    auto pGetDateFormatEx = reinterpret_cast<decltype(&GetDateFormatEx)>(GetProcAddress(kernelBase, "GetDateFormatEx"));
    auto pGetTimeFormatEx = reinterpret_cast<decltype(&GetTimeFormatEx)>(GetProcAddress(kernelBase, "GetTimeFormatEx"));
    if (!pLoadLibraryExW || !pGetDateFormatEx || !pGetTimeFormatEx) return FALSE;
    WindhawkUtils::SetFunctionHook(pLoadLibraryExW, LoadLibraryExW_Hook, &LoadLibraryExW_Original);
    WindhawkUtils::SetFunctionHook(pGetDateFormatEx, GetDateFormatEx_Hook, &GetDateFormatEx_Original);
    WindhawkUtils::SetFunctionHook(pGetTimeFormatEx, GetTimeFormatEx_Hook, &GetTimeFormatEx_Original);
    return TRUE;
}

void Wh_ModAfterInit() {
    // In case the module loaded between Wh_ModInit and the LoadLibraryExW hook going live.
    if (!g_systemTrayHooked) HookSystemTrayIfLoaded(GetSystemTrayModuleHandle());
    StartPolling();
}

void Wh_ModSettingsChanged() {
    LoadSettings();
    if (g_wakeEvent) SetEvent(g_wakeEvent);
}

void Wh_ModBeforeUninit() {
    Wh_Log(L"Before uninit");
    g_unloading = true;
    StopPolling();
    DetachClickHandlers();
    {
        std::lock_guard<std::mutex> lock(g_textMutex);
        g_line.clear();
        g_tooltip.clear();
    }
    // The hooks are still in place but have nothing to add: the clock redraws with its stock text.
    RefreshClock();
}

void Wh_ModUninit() {
    Wh_Log(L"Uninit");
    luma::Shutdown();
    RefreshClock();
    if (g_stopEvent) CloseHandle(g_stopEvent);
    if (g_wakeEvent) CloseHandle(g_wakeEvent);
    g_stopEvent = nullptr;
    g_wakeEvent = nullptr;
}

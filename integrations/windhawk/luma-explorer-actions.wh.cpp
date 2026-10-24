// ==WindhawkMod==
// @id              luma-explorer-actions
// @name            LumaBrowser Explorer Actions
// @description     Adds a "Luma" submenu to Explorer's classic right-click menu with LumaBrowser actions for the selected files (describe, summarize, read aloud, add to a knowledge base)
// @version         1.2
// @author          LumaBrowser
// @github          https://github.com/amurgola/LumaBrowser
// @include         explorer.exe
// @architecture    x86-64
// @compilerOptions -lwinhttp -lcomctl32 -lole32 -luuid
// ==/WindhawkMod==

// ==WindhawkModReadme==
/*
# LumaBrowser Explorer Actions

Right-click files or folders in File Explorer (or on the desktop) and pick
**Luma** to send them to [LumaBrowser](https://lumabyte.com):

- Images: Describe image, Ask about image, Edit with Luma
- Text, code, Markdown and PDF files: Summarize, Ask about this file, Read aloud
- Several files: Ask about these files
- Folders and documents: Add to an agent's knowledge base

The list comes from Luma itself (`POST /api/desktop/file-actions/available`),
so it only shows what your Luma can do right now: no voice installed, no Read
aloud; no image model, no Edit with Luma. The mod never hardcodes it.

## Requirements

- LumaBrowser running with Settings > API on and Settings > Extensions >
  Desktop Integration on, with its **File actions** feature switched on.
- The classic context menu: this mod adds to the classic (Win32) menu, the one
  Windows 11 shows under "Show more options", or everywhere with the
  "Classic context menu on Windows 11" mod. The new Windows 11 menu is left
  alone.

When Luma is not running the menu is exactly the Windows one.

## How it behaves

- The submenu appears at once; Luma's answer is fetched in the background
  while the menu is open and fills the submenu when you hover it. If Luma has
  not answered within the fetch timeout, the actions last seen for the same
  kind of selection are shown, else a single "Ask Luma about this".
- Picking an action brings Luma to the front and runs it there; Explorer never
  waits for it.
- Only file-system items are handled (not Control Panel, This PC, libraries'
  virtual entries and the like).
*/
// ==/WindhawkModReadme==

// ==WindhawkModSettings==
/*
- menuLabel: Luma
  $name: Submenu label
- menuPosition: bottom
  $name: Submenu position
  $options:
  - bottom: Above Properties
  - top: At the top of the menu
- fetchTimeoutMs: 150
  $name: Wait for Luma (ms)
  $description: >-
    How long hovering the submenu may wait for Luma's answer before falling
    back to the actions seen last time (the request itself starts when the
    menu opens). 0 to 1000.
- maxItems: 50
  $name: Most selected items
  $description: Selections larger than this get no Luma submenu.
- apiKey: ""
  $name: Luma API key
  $description: >-
    Only needed when Luma's Settings > API requires an API key. Leave empty
    otherwise.
- traceToFile: false
  $name: Trace menus to a file
  $description: >-
    Troubleshooting: writes one line per Explorer menu (and why it did or did
    not get the Luma submenu) to %TEMP%\luma-explorer-actions-trace.log.
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
// Hook point: user32!TrackPopupMenuEx inside explorer.exe. With the classic menu, the folder view (CDefView, window
// class SHELLDLL_DefView) builds the selection's HMENU and shows it with TrackPopupMenuEx(TPM_RETURNCMD) on its own
// UI thread, then invokes whatever command id comes back. At that moment we have both the finished HMENU and, through
// the view's IShellBrowser (CWM_GETISHELLBROWSER, WM_USER + 7, answered by the Explorer tab and the desktop
// windows), the selection that menu was built for. We add a "Luma" submenu with ids far above the shell's range,
// and when the call returns one of ours we run it and return 0, so the view invokes nothing. Every other menu in
// Explorer (taskbar, tray, navigation pane, column headers, background) is passed straight through.
//
// The same technique (a TrackPopupMenuEx hook filtered to SHELLDLL_DefView plus CWM_GETISHELLBROWSER) is used by
// public Windhawk mods such as explorer-context-menu-custom-items; no code was copied from them.
//
// Nothing blocks the menu: /available is requested on the thread pool when the menu opens, and the submenu is
// filled on WM_INITMENUPOPUP (when the user hovers it), waiting at most fetchTimeoutMs for the answer before falling
// back to a per-selection-kind cache, then to a single "Ask Luma about this".

#include <commctrl.h>
#include <shlobj.h>
#include <shobjidl.h>

#include <algorithm>
#include <cstdarg>
#include <cwctype>
#include <map>
#include <memory>
#include <vector>

namespace {

constexpr UINT kIdFirst = 0xE600;      // our action ids: kIdFirst .. kIdFirst + kMaxActions - 1
constexpr UINT kMaxActions = 64;
constexpr UINT kSubmenuId = 0xE5FE;    // the "Luma" item itself
constexpr UINT kSeparatorId = 0xE5FF;  // the separator we add next to it
constexpr UINT_PTR kSubclassId = 0x4C554D41;
constexpr size_t kMaxCacheEntries = 128;

struct Settings {
    std::wstring label = L"Luma";
    bool top = false;
    DWORD fetchTimeoutMs = 150;
    UINT maxItems = 50;
    bool trace = false;
};

struct Action {
    std::string id;
    std::wstring label;
    std::wstring group;
};

// Shared by the menu (UI thread) and the /available callback (pool thread).
struct Fetch {
    std::mutex mutex;
    bool done = false;
    bool ok = false;
    std::vector<Action> actions;
    HANDLE event = CreateEventW(nullptr, TRUE, FALSE, nullptr);
    ~Fetch() {
        if (event) CloseHandle(event);
    }
    void Finish(bool success, std::vector<Action> list) {
        {
            std::lock_guard<std::mutex> lock(mutex);
            done = true;
            ok = success;
            actions = std::move(list);
        }
        if (event) SetEvent(event);
    }
};

struct MenuSession {
    HMENU menu = nullptr;
    HMENU submenu = nullptr;
    std::vector<std::wstring> paths;
    std::vector<bool> folders;
    bool foldersOnly = true;
    std::string signature;
    std::shared_ptr<Fetch> fetch;
    ULONGLONG openedAt = 0;
    DWORD timeoutMs = 150;
    bool filled = false;
    std::vector<Action> shown;
};

std::mutex g_settingsMutex;
Settings g_settings;

std::mutex g_cacheMutex;
std::map<std::string, std::vector<Action>> g_cache;

// Menus open right now (owner windows), so Wh_ModUninit can close them and wait before the DLL goes away.
std::mutex g_openMutex;
std::vector<HWND> g_openOwners;
std::atomic<long> g_inHook{0};

using TrackPopupMenuEx_t = BOOL(WINAPI*)(HMENU, UINT, int, int, HWND, LPTPMPARAMS);
TrackPopupMenuEx_t TrackPopupMenuEx_Original = nullptr;

Settings CurrentSettings() {
    std::lock_guard<std::mutex> lock(g_settingsMutex);
    return g_settings;
}

// The traceToFile setting: one line per menu in %TEMP%\luma-explorer-actions-trace.log, so a user can see why a
// menu was skipped without Windhawk's debug log. Off by default; cheap no-op then.
std::mutex g_traceMutex;

void Trace(const wchar_t* format, ...) {
    if (!CurrentSettings().trace) return;
    wchar_t line[1024];
    va_list args;
    va_start(args, format);
    _vsnwprintf_s(line, ARRAYSIZE(line), _TRUNCATE, format, args);
    va_end(args);
    wchar_t dir[MAX_PATH];
    DWORD n = GetTempPathW(ARRAYSIZE(dir), dir);
    if (!n || n >= ARRAYSIZE(dir)) return;
    std::wstring file = std::wstring(dir) + L"luma-explorer-actions-trace.log";
    SYSTEMTIME t;
    GetLocalTime(&t);
    wchar_t stamp[32];
    _snwprintf_s(stamp, ARRAYSIZE(stamp), _TRUNCATE, L"%02u:%02u:%02u.%03u ", t.wHour, t.wMinute, t.wSecond, t.wMilliseconds);
    std::string utf8 = luma::json::ToUtf8(std::wstring(stamp) + line + L"\r\n");
    std::lock_guard<std::mutex> lock(g_traceMutex);
    HANDLE h = CreateFileW(file.c_str(), FILE_APPEND_DATA, FILE_SHARE_READ | FILE_SHARE_WRITE, nullptr, OPEN_ALWAYS, FILE_ATTRIBUTE_NORMAL, nullptr);
    if (h == INVALID_HANDLE_VALUE) return;
    DWORD written = 0;
    WriteFile(h, utf8.data(), static_cast<DWORD>(utf8.size()), &written, nullptr);
    CloseHandle(h);
}

// "SHELLDLL_DefView < ShellTabWindowClass < ..." for the trace.
std::wstring ClassChain(HWND hwnd) {
    std::wstring out;
    for (int depth = 0; hwnd && depth < 10; depth++, hwnd = GetParent(hwnd)) {
        wchar_t cls[64] = {};
        GetClassNameW(hwnd, cls, ARRAYSIZE(cls));
        if (!out.empty()) out += L" < ";
        out += cls;
    }
    return out;
}

bool ClassIs(HWND hwnd, const wchar_t* name) {
    wchar_t cls[64] = {};
    return GetClassNameW(hwnd, cls, ARRAYSIZE(cls)) > 0 && wcscmp(cls, name) == 0;
}

// The menu's owner is the folder view or one of its children.
bool IsFolderViewWindow(HWND hwnd) {
    for (int depth = 0; hwnd && depth < 8; depth++, hwnd = GetParent(hwnd)) {
        if (ClassIs(hwnd, L"SHELLDLL_DefView")) return true;
    }
    return false;
}

// The view's browser: only windows known to answer CWM_GETISHELLBROWSER are asked. Not AddRef'ed.
IShellBrowser* BrowserOf(HWND hwnd) {
    static const wchar_t* const kHosts[] = {L"ShellTabWindowClass", L"CabinetWClass", L"ExploreWClass", L"Progman", L"WorkerW"};
    for (int depth = 0; hwnd && depth < 16; depth++, hwnd = GetParent(hwnd)) {
        for (const wchar_t* host : kHosts) {
            if (!ClassIs(hwnd, host)) continue;
            auto* browser = reinterpret_cast<IShellBrowser*>(SendMessageW(hwnd, WM_USER + 7, 0, 0));
            if (browser) return browser;
        }
    }
    return nullptr;
}

// The selected file-system paths, or false when there is no selection, a virtual item, or too many.
bool SelectedPaths(IShellBrowser* browser, UINT maxItems, std::vector<std::wstring>* paths, std::vector<bool>* folders, bool* foldersOnly) {
    IShellView* view = nullptr;
    if (FAILED(browser->QueryActiveShellView(&view)) || !view) return false;
    IFolderView2* folderView = nullptr;
    HRESULT hr = view->QueryInterface(IID_PPV_ARGS(&folderView));
    view->Release();
    if (FAILED(hr) || !folderView) return false;
    IShellItemArray* items = nullptr;
    hr = folderView->GetSelection(FALSE, &items);
    folderView->Release();
    if (hr != S_OK || !items) {
        if (items) items->Release();
        return false;
    }
    DWORD count = 0;
    bool ok = SUCCEEDED(items->GetCount(&count)) && count > 0 && count <= maxItems;
    *foldersOnly = true;
    for (DWORD i = 0; ok && i < count; i++) {
        IShellItem* item = nullptr;
        if (FAILED(items->GetItemAt(i, &item)) || !item) {
            ok = false;
            break;
        }
        SFGAOF attrs = 0;
        item->GetAttributes(SFGAO_FILESYSTEM | SFGAO_FOLDER | SFGAO_STREAM, &attrs);
        PWSTR path = nullptr;
        if ((attrs & SFGAO_FILESYSTEM) && SUCCEEDED(item->GetDisplayName(SIGDN_FILESYSPATH, &path)) && path) {
            paths->push_back(path);
            CoTaskMemFree(path);
            // A .zip is a folder to the shell but a stream on disk.
            bool folder = (attrs & SFGAO_FOLDER) && !(attrs & SFGAO_STREAM);
            folders->push_back(folder);
            if (!folder) *foldersOnly = false;
        } else {
            ok = false;
        }
        item->Release();
    }
    items->Release();
    return ok && !paths->empty();
}

// The kind of selection, for the fallback cache: sorted unique extensions ("<dir>" for folders) and one vs many.
std::string SignatureOf(const std::vector<std::wstring>& paths, const std::vector<bool>& folders) {
    std::vector<std::string> kinds;
    for (size_t i = 0; i < paths.size(); i++) {
        const std::wstring& p = paths[i];
        if (i < folders.size() && folders[i]) {
            kinds.push_back("<dir>");
            continue;
        }
        size_t slash = p.find_last_of(L"\\/");
        size_t dot = p.find_last_of(L'.');
        std::wstring ext = dot != std::wstring::npos && (slash == std::wstring::npos || dot > slash) ? p.substr(dot) : L"";
        for (wchar_t& c : ext) c = static_cast<wchar_t>(std::towlower(c));
        kinds.push_back(luma::json::ToUtf8(ext));
    }
    std::sort(kinds.begin(), kinds.end());
    kinds.erase(std::unique(kinds.begin(), kinds.end()), kinds.end());
    std::string sig = paths.size() == 1 ? "1|" : "n|";
    for (const std::string& k : kinds) sig += k + ",";
    return sig;
}

std::string PathsBody(const std::vector<std::wstring>& paths) {
    std::string body = "[";
    for (size_t i = 0; i < paths.size(); i++) {
        if (i) body += ",";
        body += luma::json::Quote(luma::json::ToUtf8(paths[i]));
    }
    return body + "]";
}

// { "actions": [ { "id", "label", "group" }, ... ] } -> the list; false when the answer has no actions array.
bool ParseActions(const std::string& body, std::vector<Action>* out) {
    std::string arr;
    if (!luma::json::GetRaw(body, "actions", &arr)) return false;
    std::string_view s(arr);
    size_t i = luma::json::SkipWs(s, 0);
    if (i >= s.size() || s[i] != '[') return false;
    i++;
    while (out->size() < kMaxActions) {
        i = luma::json::SkipWs(s, i);
        if (i >= s.size() || s[i] == ']') break;
        size_t end = luma::json::SkipValue(s, i);
        if (end == std::string_view::npos) return false;
        std::string_view obj = s.substr(i, end - i);
        std::string id, label, group;
        if (luma::json::GetString(obj, "id", &id) && luma::json::GetString(obj, "label", &label) && !id.empty() && !label.empty()) {
            luma::json::GetString(obj, "group", &group);
            out->push_back({id, luma::json::FromUtf8(label), luma::json::FromUtf8(group)});
        }
        i = luma::json::SkipWs(s, end);
        if (i < s.size() && s[i] == ',') i++;
    }
    return true;
}

void CachePut(const std::string& signature, const std::vector<Action>& actions) {
    std::lock_guard<std::mutex> lock(g_cacheMutex);
    if (g_cache.size() >= kMaxCacheEntries && !g_cache.count(signature)) g_cache.clear();
    g_cache[signature] = actions;
}

bool CacheGet(const std::string& signature, std::vector<Action>* out) {
    std::lock_guard<std::mutex> lock(g_cacheMutex);
    auto it = g_cache.find(signature);
    if (it == g_cache.end()) return false;
    *out = it->second;
    return true;
}

// Starts POST /file-actions/available; the answer lands in `fetch` and in the cache.
void StartFetch(const std::shared_ptr<Fetch>& fetch, const std::vector<std::wstring>& paths, const std::string& signature) {
    std::string body = "{\"paths\":" + PathsBody(paths) + "}";
    bool queued = luma::PostAsync(L"/file-actions/available", body, [fetch, signature](const luma::Response& r) {
        std::vector<Action> actions;
        bool ok = r.ok() && ParseActions(r.body, &actions);
        if (ok) CachePut(signature, actions);
        else Wh_Log(L"available: HTTP %d, error %u", r.status, r.error);
        fetch->Finish(ok, std::move(actions));
    });
    if (!queued) fetch->Finish(false, {});
}

std::wstring MenuText(const std::wstring& text) {
    std::wstring out;
    for (wchar_t c : text) {
        if (c == L'&') out += L'&';
        out += c;
    }
    return out;
}

void ClearMenu(HMENU menu) {
    for (int n = GetMenuItemCount(menu); n > 0; n--) DeleteMenu(menu, 0, MF_BYPOSITION);
}

// Fills the submenu once: Luma's answer (waiting up to the timeout counted from when the menu opened), else the
// cached list for this kind of selection, else "Ask Luma about this".
void FillSubmenu(MenuSession& s, bool mayWait) {
    if (s.filled) return;
    s.filled = true;
    if (mayWait && s.fetch && s.fetch->event) {
        ULONGLONG elapsed = GetTickCount64() - s.openedAt;
        DWORD remaining = elapsed >= s.timeoutMs ? 0 : static_cast<DWORD>(s.timeoutMs - elapsed);
        WaitForSingleObject(s.fetch->event, remaining);
    }
    std::vector<Action> actions;
    bool known = false;
    if (s.fetch) {
        std::lock_guard<std::mutex> lock(s.fetch->mutex);
        if (s.fetch->done && s.fetch->ok) {
            actions = s.fetch->actions;
            known = true;
        }
    }
    if (!known) known = CacheGet(s.signature, &actions);
    ClearMenu(s.submenu);
    s.shown.clear();
    if (!known) {
        if (s.foldersOnly) {
            AppendMenuW(s.submenu, MF_STRING | MF_GRAYED, 0, L"Luma did not answer");
            return;
        }
        actions.push_back({"ask", L"Ask Luma about this", L""});
    }
    if (actions.empty()) {
        AppendMenuW(s.submenu, MF_STRING | MF_GRAYED, 0, L"No Luma actions for this selection");
        return;
    }
    std::wstring group = actions.front().group;
    for (const Action& a : actions) {
        if (s.shown.size() >= kMaxActions) break;
        if (a.group != group) {
            AppendMenuW(s.submenu, MF_SEPARATOR, 0, nullptr);
            group = a.group;
        }
        AppendMenuW(s.submenu, MF_STRING, kIdFirst + static_cast<UINT>(s.shown.size()), MenuText(a.label).c_str());
        s.shown.push_back(a);
    }
}

LRESULT CALLBACK OwnerSubclassProc(HWND hwnd, UINT msg, WPARAM wParam, LPARAM lParam, UINT_PTR, DWORD_PTR refData) {
    if (msg == WM_INITMENUPOPUP) {
        auto* session = reinterpret_cast<MenuSession*>(refData);
        if (session && reinterpret_cast<HMENU>(wParam) == session->submenu) {
            try {
                FillSubmenu(*session, true);
            } catch (...) {
            }
            return 0;
        }
    }
    return DefSubclassProc(hwnd, msg, wParam, lParam);
}

int LastSeparatorIndex(HMENU menu) {
    for (int i = GetMenuItemCount(menu) - 1; i >= 0; i--) {
        MENUITEMINFOW info = {sizeof(info)};
        info.fMask = MIIM_FTYPE;
        if (GetMenuItemInfoW(menu, i, TRUE, &info) && (info.fType & MFT_SEPARATOR)) return i;
    }
    return -1;
}

bool InsertLumaItem(HMENU menu, HMENU submenu, const Settings& settings) {
    MENUITEMINFOW item = {sizeof(item)};
    item.fMask = MIIM_ID | MIIM_SUBMENU | MIIM_STRING;
    item.wID = kSubmenuId;
    item.hSubMenu = submenu;
    std::wstring label = settings.label.empty() ? L"Luma" : settings.label;
    item.dwTypeData = label.data();
    MENUITEMINFOW sep = {sizeof(sep)};
    sep.fMask = MIIM_ID | MIIM_FTYPE;
    sep.fType = MFT_SEPARATOR;
    sep.wID = kSeparatorId;
    if (settings.top) {
        if (!InsertMenuItemW(menu, 0, TRUE, &item)) return false;
        InsertMenuItemW(menu, 1, TRUE, &sep);
        return true;
    }
    // Just above the last group (Properties): ..., [our separator], Luma, [their separator], Properties.
    int at = LastSeparatorIndex(menu);
    if (at < 0) at = GetMenuItemCount(menu);
    InsertMenuItemW(menu, at, TRUE, &sep);
    if (InsertMenuItemW(menu, at + 1, TRUE, &item)) return true;
    DeleteMenu(menu, kSeparatorId, MF_BYCOMMAND);
    return false;
}

// Decides whether this menu gets a Luma submenu; null leaves it untouched.
std::unique_ptr<MenuSession> Skip(const wchar_t* why, UINT flags, HWND owner) {
    Trace(L"skip (%s) flags=0x%X owner=%s", why, flags, ClassChain(owner).c_str());
    return nullptr;
}

std::unique_ptr<MenuSession> Prepare(HMENU menu, UINT flags, HWND owner) {
    if (!(flags & TPM_RETURNCMD) || !menu || !owner || !IsMenu(menu)) return Skip(L"not a returning menu", flags, owner);
    if (GetWindowThreadProcessId(owner, nullptr) != GetCurrentThreadId()) return Skip(L"owner on another thread", flags, owner);
    if (!IsFolderViewWindow(owner)) return Skip(L"not a folder view", flags, owner);
    // Item menus have a default verb (Open); the background, column-header and view menus do not.
    if (GetMenuDefaultItem(menu, FALSE, 0) == static_cast<UINT>(-1)) return Skip(L"no default item", flags, owner);
    if (GetMenuState(menu, kSubmenuId, MF_BYCOMMAND) != static_cast<UINT>(-1)) return Skip(L"already has the Luma item", flags, owner);
    if (!luma::HasFeature("file-actions")) return Skip(L"Luma or its file-actions feature is off", flags, owner);
    Settings settings = CurrentSettings();
    IShellBrowser* browser = BrowserOf(owner);
    if (!browser) return Skip(L"no IShellBrowser", flags, owner);
    auto session = std::make_unique<MenuSession>();
    if (!SelectedPaths(browser, settings.maxItems, &session->paths, &session->folders, &session->foldersOnly)) return Skip(L"no file-system selection", flags, owner);
    session->signature = SignatureOf(session->paths, session->folders);
    session->fetch = std::make_shared<Fetch>();
    session->openedAt = GetTickCount64();
    session->timeoutMs = settings.fetchTimeoutMs;
    StartFetch(session->fetch, session->paths, session->signature);
    // Luma said last time that nothing applies to this kind of selection: no submenu (the fetch refreshes that).
    std::vector<Action> cached;
    if (CacheGet(session->signature, &cached) && cached.empty()) return Skip(L"cached: no actions for this kind", flags, owner);
    session->submenu = CreatePopupMenu();
    if (!session->submenu) return Skip(L"CreatePopupMenu failed", flags, owner);
    AppendMenuW(session->submenu, MF_STRING | MF_GRAYED, 0, L"Asking Luma...");
    if (!InsertLumaItem(menu, session->submenu, settings)) {
        DestroyMenu(session->submenu);
        return Skip(L"could not insert the item", flags, owner);
    }
    session->menu = menu;
    Trace(L"added for %u item(s) %S", static_cast<unsigned>(session->paths.size()), session->signature.c_str());
    return session;
}

void RunAction(const MenuSession& s, const Action& action) {
    luma::AllowForeground();
    std::string body = "{\"action\":" + luma::json::Quote(action.id) + ",\"paths\":" + PathsBody(s.paths) + "}";
    std::string id = action.id;
    bool queued = luma::PostAsync(L"/file-actions/run", body, [id](const luma::Response& r) {
        if (r.ok()) Wh_Log(L"run %S: %S", id.c_str(), r.body.substr(0, 200).c_str());
        else Wh_Log(L"run %S failed: HTTP %d, error %u, %S", id.c_str(), r.status, r.error, r.body.substr(0, 300).c_str());
    });
    if (!queued) Wh_Log(L"run %S could not be queued", id.c_str());
}

void TrackOwner(HWND owner, bool add) {
    std::lock_guard<std::mutex> lock(g_openMutex);
    if (add) {
        g_openOwners.push_back(owner);
        return;
    }
    auto it = std::find(g_openOwners.begin(), g_openOwners.end(), owner);
    if (it != g_openOwners.end()) g_openOwners.erase(it);
}

// Popup menus reach the kernel through user32!TrackPopupMenuEx, user32!TrackPopupMenu or straight through
// win32u!NtUserTrackPopupMenuEx (which the other two call). All three are hooked; the outermost call on a thread
// handles the menu and the nested ones pass straight through, so a menu is never handled twice.
thread_local int t_menuDepth = 0;

template <typename CallOriginal>
BOOL HandleMenu(const wchar_t* via, HMENU menu, UINT flags, HWND owner, CallOriginal callOriginal) {
    if (t_menuDepth > 0) return callOriginal();
    Trace(L"%s flags=0x%X owner=%s", via, flags, ClassChain(owner).c_str());
    t_menuDepth++;
    g_inHook++;
    std::unique_ptr<MenuSession> session;
    try {
        session = Prepare(menu, flags, owner);
    } catch (...) {
        session.reset();
    }
    if (!session) {
        BOOL plain = callOriginal();
        g_inHook--;
        t_menuDepth--;
        return plain;
    }
    bool subclassed = SetWindowSubclass(owner, OwnerSubclassProc, kSubclassId, reinterpret_cast<DWORD_PTR>(session.get()));
    if (!subclassed) {
        try {
            FillSubmenu(*session, false);
        } catch (...) {
        }
    }
    TrackOwner(owner, true);
    BOOL result = callOriginal();
    TrackOwner(owner, false);
    if (subclassed) RemoveWindowSubclass(owner, OwnerSubclassProc, kSubclassId);
    UINT picked = static_cast<UINT>(result);
    if (picked >= kIdFirst && picked < kIdFirst + session->shown.size()) {
        try {
            RunAction(*session, session->shown[picked - kIdFirst]);
        } catch (...) {
        }
        result = 0;
    }
    // Leave the caller's menu as it was; DeleteMenu destroys our submenu too.
    if (IsMenu(menu)) {
        if (DeleteMenu(menu, kSubmenuId, MF_BYCOMMAND)) session->submenu = nullptr;
        DeleteMenu(menu, kSeparatorId, MF_BYCOMMAND);
    }
    if (session->submenu && IsMenu(session->submenu)) DestroyMenu(session->submenu);
    session.reset();
    g_inHook--;
    t_menuDepth--;
    return result;
}

BOOL WINAPI TrackPopupMenuEx_Hook(HMENU menu, UINT flags, int x, int y, HWND owner, LPTPMPARAMS params) {
    return HandleMenu(L"TrackPopupMenuEx", menu, flags, owner, [&] { return TrackPopupMenuEx_Original(menu, flags, x, y, owner, params); });
}

using TrackPopupMenu_t = BOOL(WINAPI*)(HMENU, UINT, int, int, int, HWND, const RECT*);
TrackPopupMenu_t TrackPopupMenu_Original = nullptr;

BOOL WINAPI TrackPopupMenu_Hook(HMENU menu, UINT flags, int x, int y, int reserved, HWND owner, const RECT* rect) {
    return HandleMenu(L"TrackPopupMenu", menu, flags, owner, [&] { return TrackPopupMenu_Original(menu, flags, x, y, reserved, owner, rect); });
}

TrackPopupMenuEx_t NtUserTrackPopupMenuEx_Original = nullptr;

BOOL WINAPI NtUserTrackPopupMenuEx_Hook(HMENU menu, UINT flags, int x, int y, HWND owner, LPTPMPARAMS params) {
    return HandleMenu(L"NtUserTrackPopupMenuEx", menu, flags, owner, [&] { return NtUserTrackPopupMenuEx_Original(menu, flags, x, y, owner, params); });
}

void LoadSettings() {
    Settings next;
    PCWSTR label = Wh_GetStringSetting(L"menuLabel");
    if (label) {
        if (*label) next.label = label;
        Wh_FreeStringSetting(label);
    }
    PCWSTR position = Wh_GetStringSetting(L"menuPosition");
    if (position) {
        next.top = wcscmp(position, L"top") == 0;
        Wh_FreeStringSetting(position);
    }
    int timeout = Wh_GetIntSetting(L"fetchTimeoutMs");
    next.fetchTimeoutMs = static_cast<DWORD>(timeout < 0 ? 0 : timeout > 1000 ? 1000 : timeout);
    int maxItems = Wh_GetIntSetting(L"maxItems");
    next.maxItems = static_cast<UINT>(maxItems < 1 ? 50 : maxItems > 100 ? 100 : maxItems);
    next.trace = Wh_GetIntSetting(L"traceToFile") != 0;
    {
        std::lock_guard<std::mutex> lock(g_settingsMutex);
        g_settings = next;
    }
    luma::Config config;
    config.clientName = L"windhawk-luma-explorer-actions/1.0";
    PCWSTR apiKey = Wh_GetStringSetting(L"apiKey");
    if (apiKey) {
        config.apiKey = apiKey;
        Wh_FreeStringSetting(apiKey);
    }
    luma::Configure(config);
}

}  // namespace

BOOL Wh_ModInit() {
    Wh_Log(L"Init");
    LoadSettings();
    bool any = false;
    if (Wh_SetFunctionHook(reinterpret_cast<void*>(TrackPopupMenuEx), reinterpret_cast<void*>(TrackPopupMenuEx_Hook),
                           reinterpret_cast<void**>(&TrackPopupMenuEx_Original))) {
        any = true;
    } else {
        Wh_Log(L"Could not hook TrackPopupMenuEx");
    }
    if (Wh_SetFunctionHook(reinterpret_cast<void*>(TrackPopupMenu), reinterpret_cast<void*>(TrackPopupMenu_Hook),
                           reinterpret_cast<void**>(&TrackPopupMenu_Original))) {
        any = true;
    } else {
        Wh_Log(L"Could not hook TrackPopupMenu");
    }
    HMODULE win32u = GetModuleHandleW(L"win32u.dll");
    void* ntTrack = win32u ? reinterpret_cast<void*>(GetProcAddress(win32u, "NtUserTrackPopupMenuEx")) : nullptr;
    if (ntTrack && Wh_SetFunctionHook(ntTrack, reinterpret_cast<void*>(NtUserTrackPopupMenuEx_Hook),
                                      reinterpret_cast<void**>(&NtUserTrackPopupMenuEx_Original))) {
        any = true;
    } else {
        Wh_Log(L"Could not hook NtUserTrackPopupMenuEx");
    }
    Trace(L"init: hooks %s, file-actions %s", any ? L"set" : L"FAILED", luma::HasFeature("file-actions") ? L"on" : L"off");
    return any ? TRUE : FALSE;
}

void Wh_ModSettingsChanged() {
    LoadSettings();
}

void Wh_ModUninit() {
    Wh_Log(L"Uninit");
    // A menu still open runs inside our hook: close it and wait (bounded) until the hook has returned.
    {
        std::lock_guard<std::mutex> lock(g_openMutex);
        for (HWND owner : g_openOwners) PostMessageW(owner, WM_CANCELMODE, 0, 0);
    }
    for (int waited = 0; g_inHook > 0 && waited < 3000; waited += 20) Sleep(20);
    luma::Shutdown();
}

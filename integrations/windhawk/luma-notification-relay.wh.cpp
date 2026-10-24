// ==WindhawkMod==
// @id              luma-notification-relay
// @name            LumaBrowser Notification Relay
// @description     Sends every Windows notification (toast) to LumaBrowser, which files it in the Personal Hub queue
// @version         1.0
// @author          LumaBrowser
// @github          https://github.com/amurgola/LumaBrowser
// @include         explorer.exe
// @architecture    x86-64
// @architecture    arm64
// @compilerOptions -lwinhttp -lole32 -loleaut32 -lruntimeobject
// ==/WindhawkMod==

// ==WindhawkModReadme==
/*
# LumaBrowser Notification Relay

Relays the notifications Windows shows (toasts from Teams, Slack, Outlook,
WhatsApp, Docker, anything) to [LumaBrowser](https://lumabyte.com), which files
them in the Personal Hub's conversation queue next to the web notifications it
already collects. Known chat and mail apps land on the same thread as their web
notifications.

## How it works

The mod runs one background thread inside Explorer (only in the first Explorer
process of the session). That thread reads the Action Center through the public
Windows API for notification listeners (`UserNotificationListener`), which a
desktop process may use without an app package, and looks for new toasts when
Windows reports a change (or every couple of seconds where change events are not
delivered). New toasts are batched and sent to Luma in the background. It hooks
nothing and never touches Explorer's UI thread.

When Luma is not running, or the `notifications` feature is off, new toasts are
simply dropped: nothing queues up and Windows behaves as usual.

## Requirements

- LumaBrowser running with Settings > API on and Settings > Extensions >
  Desktop Integration > OS notifications on.
- Windows must let desktop apps read notifications: Settings > Privacy &
  security > Notifications > "Notification access" and "Let desktop apps access
  your notifications" on. The mod only reads this setting; it never changes it.
  The log says so when access is off.

## Limits

- Only toasts that reach the Action Center are seen. A toast that an app marks
  as popup-only, or one the user dismisses within the poll interval while change
  events are unavailable, can be missed.
- Windows does not expose a toast's tag, group or launch arguments to listeners,
  so those are not sent; Luma groups by app and title instead.
- Toasts already in the Action Center when the mod starts are not sent (unless
  "Send existing notifications at start" is on).
*/
// ==/WindhawkModReadme==

// ==WindhawkModSettings==
/*
- excludedApps: [""]
  $name: Excluded apps
  $description: >-
    Apps whose notifications are never sent: the app name as Windows shows it
    (e.g. Docker Desktop) or its AUMID. Case-insensitive; * is a wildcard.
- includeText: true
  $name: Include the notification text
  $description: >-
    Off: only the app and the time are sent (the title becomes "New
    notification"), never what the notification says.
- sendExisting: false
  $name: Send existing notifications at start
  $description: >-
    Also send the toasts already in the Action Center when the mod starts.
- pollIntervalMs: 2000
  $name: Check interval (ms)
  $description: >-
    How often to look for new toasts when Windows does not report changes
    (500 to 60000).
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
//
// One worker thread per session (a named mutex picks the first Explorer process; another takes over if that one
// exits). The thread reads the Action Center with UserNotificationListener: it waits for NotificationChanged when
// Windows delivers it to this unpackaged process, and otherwise polls. Toast ids it has not seen yet are sent to
// POST /api/desktop/notifications/ in batches with the blocking client call (this is a worker thread). Nothing is
// hooked, nothing runs on a UI thread, and when Luma is not reachable the batch is dropped.

#include <winrt/Windows.Foundation.h>
#include <winrt/Windows.Foundation.Collections.h>
#include <winrt/Windows.ApplicationModel.h>
#include <winrt/Windows.UI.Notifications.h>
#include <winrt/Windows.UI.Notifications.Management.h>

#include <vector>
#include <unordered_set>

namespace relay {

namespace wf = winrt::Windows::Foundation;
namespace wun = winrt::Windows::UI::Notifications;
namespace wunm = winrt::Windows::UI::Notifications::Management;

constexpr wchar_t kClientName[] = L"windhawk-luma-notification-relay/1.0";
constexpr wchar_t kMutexName[] = L"Local\\LumaBrowser.NotificationRelay";
constexpr wchar_t kEndpoint[] = L"/notifications/";
constexpr char kFeature[] = "notifications";
constexpr size_t kBatchSize = 50;
constexpr DWORD kEventSafetyPollMs = 30000;
constexpr DWORD kNoAccessRetryMs = 60000;

struct Settings {
    std::vector<std::wstring> excluded;
    bool includeText = true;
    bool sendExisting = false;
    DWORD pollMs = 2000;
};

std::mutex g_settingsMutex;
Settings g_settings;
HANDLE g_stopEvent = nullptr;
HANDLE g_wakeEvent = nullptr;
HANDLE g_thread = nullptr;

Settings CurrentSettings() {
    std::lock_guard<std::mutex> lock(g_settingsMutex);
    return g_settings;
}

void LoadSettings() {
    Settings s;
    for (int i = 0; i < 200; i++) {
        PCWSTR value = Wh_GetStringSetting(L"excludedApps[%d]", i);
        if (!value) break;
        bool empty = !*value;
        if (!empty) s.excluded.emplace_back(value);
        Wh_FreeStringSetting(value);
        if (empty && i > 0) break;
    }
    s.includeText = Wh_GetIntSetting(L"includeText") != 0;
    s.sendExisting = Wh_GetIntSetting(L"sendExisting") != 0;
    int poll = Wh_GetIntSetting(L"pollIntervalMs");
    s.pollMs = static_cast<DWORD>(poll < 500 ? 500 : poll > 60000 ? 60000 : poll);

    luma::Config config;
    config.clientName = kClientName;
    PCWSTR apiKey = Wh_GetStringSetting(L"apiKey");
    if (apiKey) {
        config.apiKey = apiKey;
        Wh_FreeStringSetting(apiKey);
    }
    luma::Configure(config);

    std::lock_guard<std::mutex> lock(g_settingsMutex);
    g_settings = std::move(s);
}

// Case-insensitive match where '*' stands for any run of characters.
bool WildMatch(const wchar_t* p, const wchar_t* s) {
    const wchar_t* star = nullptr;
    const wchar_t* resume = nullptr;
    while (*s) {
        if (*p == L'*') {
            star = p++;
            resume = s;
        } else if (*p && towlower(*p) == towlower(*s)) {
            p++;
            s++;
        } else if (star) {
            p = star + 1;
            s = ++resume;
        } else {
            return false;
        }
    }
    while (*p == L'*') p++;
    return !*p;
}

bool IsExcluded(const Settings& settings, const std::wstring& app, const std::wstring& appId) {
    for (const std::wstring& pattern : settings.excluded) {
        if ((!app.empty() && WildMatch(pattern.c_str(), app.c_str())) || (!appId.empty() && WildMatch(pattern.c_str(), appId.c_str()))) return true;
    }
    return false;
}

std::string IsoTime(const wf::DateTime& time) {
    FILETIME ft = winrt::clock::to_FILETIME(time);
    SYSTEMTIME st = {};
    if (!FileTimeToSystemTime(&ft, &st)) return {};
    char buf[40];
    wsprintfA(buf, "%04u-%02u-%02uT%02u:%02u:%02u.%03uZ", st.wYear, st.wMonth, st.wDay, st.wHour, st.wMinute, st.wSecond, st.wMilliseconds);
    return buf;
}

// One notification as JSON for Luma, or "" when it is excluded or unreadable.
std::string ItemJson(const wun::UserNotification& n, const Settings& settings) {
    std::wstring app;
    std::wstring appId;
    try {
        auto info = n.AppInfo();
        try { appId = info.AppUserModelId().c_str(); } catch (...) {}
        try { app = info.DisplayInfo().DisplayName().c_str(); } catch (...) {}
        if (appId.empty()) {
            try { appId = info.PackageFamilyName().c_str(); } catch (...) {}
        }
    } catch (...) {
    }
    if (app.empty()) app = appId.empty() ? L"Unknown app" : appId;
    if (IsExcluded(settings, app, appId)) return {};

    std::vector<std::wstring> lines;
    if (settings.includeText) {
        try {
            auto binding = n.Notification().Visual().GetBinding(wun::KnownNotificationBindings::ToastGeneric());
            if (binding) {
                for (auto const& text : binding.GetTextElements()) {
                    std::wstring line = text.Text().c_str();
                    if (!line.empty()) lines.push_back(std::move(line));
                }
            }
        } catch (...) {
        }
    }

    std::string json = "{\"app\":" + luma::json::Quote(luma::json::ToUtf8(app));
    json += ",\"appId\":" + luma::json::Quote(luma::json::ToUtf8(appId));
    if (settings.includeText && !lines.empty()) {
        json += ",\"title\":" + luma::json::Quote(luma::json::ToUtf8(lines[0]));
        std::wstring body;
        for (size_t i = 1; i < lines.size(); i++) {
            if (!body.empty()) body += L"\n";
            body += lines[i];
        }
        json += ",\"body\":" + luma::json::Quote(luma::json::ToUtf8(body));
        json += ",\"lines\":[";
        for (size_t i = 0; i < lines.size(); i++) {
            if (i) json += ",";
            json += luma::json::Quote(luma::json::ToUtf8(lines[i]));
        }
        json += "]";
    } else {
        json += ",\"title\":\"New notification\",\"body\":\"\",\"lines\":[]";
    }
    try {
        std::string at = IsoTime(n.CreationTime());
        if (!at.empty()) json += ",\"at\":" + luma::json::Quote(at);
    } catch (...) {
    }
    json += ",\"osId\":" + std::to_string(n.Id());
    json += "}";
    return json;
}

void SendBatch(const std::vector<std::string>& items) {
    for (size_t start = 0; start < items.size(); start += kBatchSize) {
        if (WaitForSingleObject(g_stopEvent, 0) == WAIT_OBJECT_0) return;
        std::string body = "{\"notifications\":[";
        for (size_t i = start; i < items.size() && i < start + kBatchSize; i++) {
            if (i > start) body += ",";
            body += items[i];
        }
        body += "]}";
        luma::Response r = luma::Post(kEndpoint, body);
        if (r.ok()) {
            Wh_Log(L"sent %u notification(s)", static_cast<unsigned>(items.size() < start + kBatchSize ? items.size() - start : kBatchSize));
        } else {
            Wh_Log(L"Luma did not take the notifications (HTTP %d, error %u); dropped", r.status, r.error);
        }
    }
}

// Reads the Action Center once; sends the toasts whose ids are new. Returns false when the listener failed.
bool Scan(const wunm::UserNotificationListener& listener, std::unordered_set<uint32_t>& seen, bool& primed) {
    wf::Collections::IVectorView<wun::UserNotification> list{nullptr};
    try {
        auto op = listener.GetNotificationsAsync(wun::NotificationKinds::Toast);
        if (op.wait_for(std::chrono::seconds(5)) != wf::AsyncStatus::Completed) {
            op.Cancel();
            return false;
        }
        list = op.GetResults();
    } catch (...) {
        return false;
    }
    Settings settings = CurrentSettings();
    bool send = primed || settings.sendExisting;
    bool lumaUp = send && luma::HasFeature(kFeature);
    std::unordered_set<uint32_t> current;
    std::vector<std::string> batch;
    for (auto const& n : list) {
        uint32_t id = 0;
        try { id = n.Id(); } catch (...) { continue; }
        current.insert(id);
        if (!lumaUp || seen.count(id)) continue;
        std::string item;
        try { item = ItemJson(n, settings); } catch (...) {}
        if (!item.empty()) batch.push_back(std::move(item));
    }
    seen.swap(current);
    primed = true;
    if (!batch.empty()) SendBatch(batch);
    return true;
}

void Run() {
    wunm::UserNotificationListener listener{nullptr};
    try {
        listener = wunm::UserNotificationListener::Current();
    } catch (...) {
        Wh_Log(L"UserNotificationListener is not available");
        return;
    }
    bool loggedNoAccess = false;
    while (true) {
        wunm::UserNotificationListenerAccessStatus access = wunm::UserNotificationListenerAccessStatus::Unspecified;
        try { access = listener.GetAccessStatus(); } catch (...) {}
        if (access == wunm::UserNotificationListenerAccessStatus::Allowed) break;
        if (!loggedNoAccess) {
            Wh_Log(L"Notification access is off (status %d): turn on Settings > Privacy & security > Notifications > desktop apps access", static_cast<int>(access));
            loggedNoAccess = true;
        }
        if (WaitForSingleObject(g_stopEvent, kNoAccessRetryMs) == WAIT_OBJECT_0) return;
    }

    winrt::event_token token{};
    bool events = false;
    try {
        token = listener.NotificationChanged([](auto&&, auto&&) { if (g_wakeEvent) SetEvent(g_wakeEvent); });
        events = true;
    } catch (...) {
        events = false;
    }
    Wh_Log(L"listening for toasts (%s)", events ? L"change events" : L"polling");

    std::unordered_set<uint32_t> seen;
    bool primed = false;
    HANDLE waits[2] = {g_stopEvent, g_wakeEvent};
    while (true) {
        Scan(listener, seen, primed);
        DWORD timeout = events ? kEventSafetyPollMs : CurrentSettings().pollMs;
        DWORD w = WaitForMultipleObjects(2, waits, FALSE, timeout);
        if (w == WAIT_OBJECT_0 || w == WAIT_FAILED) break;
        // Windows raises the change before the toast is fully stored; a short pause lets a burst settle.
        if (w == WAIT_OBJECT_0 + 1 && WaitForSingleObject(g_stopEvent, 250) == WAIT_OBJECT_0) break;
    }
    if (events) {
        try { listener.NotificationChanged(token); } catch (...) {}
    }
}

DWORD WINAPI ThreadProc(LPVOID) {
    HANDLE mutex = CreateMutexW(nullptr, FALSE, kMutexName);
    if (!mutex) return 0;
    // Only one Explorer process per session relays; the others wait to take over if it exits.
    HANDLE waits[2] = {g_stopEvent, mutex};
    DWORD w = WaitForMultipleObjects(2, waits, FALSE, INFINITE);
    if (w == WAIT_OBJECT_0 + 1 || w == WAIT_ABANDONED_0 + 1) {
        try {
            winrt::init_apartment(winrt::apartment_type::multi_threaded);
            Run();
        } catch (...) {
            Wh_Log(L"relay thread stopped on an error");
        }
        try { winrt::uninit_apartment(); } catch (...) {}
        ReleaseMutex(mutex);
    }
    CloseHandle(mutex);
    return 0;
}

}  // namespace relay

BOOL Wh_ModInit() {
    Wh_Log(L"Init");
    relay::LoadSettings();
    relay::g_stopEvent = CreateEventW(nullptr, TRUE, FALSE, nullptr);
    relay::g_wakeEvent = CreateEventW(nullptr, FALSE, FALSE, nullptr);
    if (!relay::g_stopEvent || !relay::g_wakeEvent) return FALSE;
    relay::g_thread = CreateThread(nullptr, 0, relay::ThreadProc, nullptr, 0, nullptr);
    return relay::g_thread != nullptr;
}

void Wh_ModSettingsChanged() {
    relay::LoadSettings();
    if (relay::g_wakeEvent) SetEvent(relay::g_wakeEvent);
}

void Wh_ModUninit() {
    Wh_Log(L"Uninit");
    if (relay::g_stopEvent) SetEvent(relay::g_stopEvent);
    luma::Shutdown();
    if (relay::g_thread) {
        // A WinRT call is bounded to 5 s and a request to the client timeout, so this normally returns quickly. If
        // it does not, leave the events open: the thread may still use them.
        bool exited = WaitForSingleObject(relay::g_thread, 10000) == WAIT_OBJECT_0;
        CloseHandle(relay::g_thread);
        relay::g_thread = nullptr;
        if (!exited) return;
    }
    if (relay::g_wakeEvent) { CloseHandle(relay::g_wakeEvent); relay::g_wakeEvent = nullptr; }
    if (relay::g_stopEvent) { CloseHandle(relay::g_stopEvent); relay::g_stopEvent = nullptr; }
}

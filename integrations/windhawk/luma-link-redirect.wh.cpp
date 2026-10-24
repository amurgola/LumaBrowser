// ==WindhawkMod==
// @id              luma-link-redirect
// @name            LumaBrowser Link Redirect
// @description     Opens the links and web searches Windows forces into Microsoft Edge (Start menu search, widgets, Explorer) in LumaBrowser instead
// @version         1.0
// @author          LumaBrowser
// @github          https://github.com/amurgola/LumaBrowser
// @include         explorer.exe
// @include         SearchHost.exe
// @include         SearchApp.exe
// @include         StartMenuExperienceHost.exe
// @include         ShellExperienceHost.exe
// @include         Widgets.exe
// @include         WidgetService.exe
// @include         sihost.exe
// @include         RuntimeBroker.exe
// @architecture    x86-64
// @compilerOptions -lwinhttp -lole32
// ==/WindhawkMod==

// ==WindhawkModReadme==
/*
# LumaBrowser Link Redirect

Windows opens some links in Microsoft Edge no matter which browser is the
default: web results in the Start menu search, news and weather in the
widgets board, and other `microsoft-edge:` links. This mod sends them to
[LumaBrowser](https://lumabyte.com) instead, through Luma's Desktop
Integration API (`POST /api/desktop/open/`):

- a Bing search (`bing.com/search?q=...`) becomes a search with the engine
  you picked in Luma (or, if you prefer, the Bing page opened in Luma);
- a Bing click-tracking link (`bing.com/ck/a?...&u=a1...`) is decoded to the
  page it points at;
- MSN and widgets news links open as they are;
- any other link wrapped in `microsoft-edge:` opens in a Luma tab.

Everything else is untouched: ordinary programs, files, folders, and Edge
itself when you start it (from its icon, a shortcut, a pinned site or an
app window).

## When Luma is not running

The mod only steps in while Luma is running with Settings > API on and
Settings > Extensions > Desktop Integration > **Open in Luma** on (it reads
`%USERPROFILE%\.lumabrowser\desktop.json`). Otherwise Windows does what it
always did. If Luma does not accept a link (busy, an error, a timeout), the
original Edge launch runs after all, a moment later.

## How it works

It hooks the launch calls (`ShellExecuteExW`, `ShellExecuteW`,
`CreateProcessW`, `CreateProcessAsUserW`) in the shell processes listed in the
settings, and acts only on launches of `microsoft-edge:` links or of
`msedge.exe` carrying one link (`--single-argument ...`, the way Windows
starts Edge for a `microsoft-edge:` link). Such a launch is skipped and the
link is posted to Luma in the background; the hooked call never waits on the
network.

The mod's log (Windhawk > the mod > Advanced > Debug logging) names the
process and the call that caught each link; turn on **Verbose log** to also
see the Edge launches it let through.
*/
// ==/WindhawkModReadme==

// ==WindhawkModSettings==
/*
- searchMode: luma
  $name: Web searches
  $description: What to do with a Bing search that Windows sends to Edge.
  $options:
  - luma: Search in Luma with Luma's search engine
  - bing: Open the Bing results in Luma
  - edge: Leave them to Edge
- redirectNews: true
  $name: Open news and widgets links in Luma
  $description: MSN and Microsoft Start links (widgets board, news feed).
- redirectOtherLinks: true
  $name: Open other Edge links in Luma
  $description: Any other link Windows forces into Edge.
- processes: "explorer.exe, SearchHost.exe, SearchApp.exe, StartMenuExperienceHost.exe, ShellExperienceHost.exe, Widgets.exe, WidgetService.exe, sihost.exe, RuntimeBroker.exe"
  $name: Processes
  $description: >-
    Comma-separated process names the mod acts in (a subset of the ones it is
    loaded into). Empty means all of them.
- verboseLog: false
  $name: Verbose log
  $description: Also log the Edge launches the mod saw but let through.
- apiKey: ""
  $name: Luma API key
  $description: >-
    Only needed when Luma's Settings > API requires an API key. Leave empty
    otherwise.
- timeoutMs: 2500
  $name: Request timeout (ms)
  $description: >-
    How long to wait for Luma before giving the link back to Edge.
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

#include <objbase.h>
#include <shellapi.h>

#include <cwctype>
#include <memory>

namespace {

enum class SearchMode { Luma, Bing, Edge };

std::atomic<int> g_searchMode{static_cast<int>(SearchMode::Luma)};
std::atomic<bool> g_redirectNews{true};
std::atomic<bool> g_redirectOther{true};
std::atomic<bool> g_verbose{false};
std::atomic<bool> g_processEnabled{false};
wchar_t g_processName[MAX_PATH] = L"";

// Set on the thread that replays a launch Luma did not take, so the hooks let it through.
thread_local bool g_inReplay = false;

constexpr std::wstring_view kEdgeScheme = L"microsoft-edge:";
constexpr std::wstring_view kSingleArgument = L"--single-argument";
constexpr int kMaxDepth = 6;
constexpr size_t kMaxLinkLength = 16384;

// ---- text helpers ----

bool StartsWithI(std::wstring_view s, std::wstring_view prefix) {
    return s.size() >= prefix.size() && _wcsnicmp(s.data(), prefix.data(), prefix.size()) == 0;
}

size_t FindI(std::wstring_view hay, std::wstring_view needle) {
    if (needle.empty() || needle.size() > hay.size()) return std::wstring_view::npos;
    for (size_t i = 0; i + needle.size() <= hay.size(); i++) {
        if (_wcsnicmp(hay.data() + i, needle.data(), needle.size()) == 0) return i;
    }
    return std::wstring_view::npos;
}

std::wstring Trim(std::wstring_view s) {
    size_t a = 0;
    size_t b = s.size();
    while (a < b && iswspace(s[a])) a++;
    while (b > a && iswspace(s[b - 1])) b--;
    return std::wstring(s.substr(a, b - a));
}

std::wstring Unquote(std::wstring_view s) {
    std::wstring t = Trim(s);
    if (t.size() >= 2 && t.front() == L'"' && t.back() == L'"') return Trim(std::wstring_view(t).substr(1, t.size() - 2));
    return t;
}

std::wstring Lower(std::wstring_view s) {
    std::wstring out(s);
    for (auto& c : out) c = static_cast<wchar_t>(towlower(c));
    return out;
}

int HexValue(wchar_t c) {
    if (c >= L'0' && c <= L'9') return c - L'0';
    if (c >= L'a' && c <= L'f') return c - L'a' + 10;
    if (c >= L'A' && c <= L'F') return c - L'A' + 10;
    return -1;
}

// Percent-decodes to UTF-8 bytes, then back to UTF-16. plusAsSpace: form encoding (search terms), not for urls.
std::wstring PercentDecode(std::wstring_view s, bool plusAsSpace) {
    std::string bytes;
    bytes.reserve(s.size());
    for (size_t i = 0; i < s.size(); i++) {
        wchar_t c = s[i];
        if (c == L'%' && i + 2 < s.size()) {
            int hi = HexValue(s[i + 1]);
            int lo = HexValue(s[i + 2]);
            if (hi >= 0 && lo >= 0) {
                bytes += static_cast<char>((hi << 4) | lo);
                i += 2;
                continue;
            }
        }
        if (c == L'+' && plusAsSpace) {
            bytes += ' ';
        } else if (c < 0x80) {
            bytes += static_cast<char>(c);
        } else {
            bytes += luma::json::ToUtf8(std::wstring_view(&s[i], 1));
        }
    }
    return luma::json::FromUtf8(bytes);
}

// One parameter of a query string (without the leading '?'), name compared case-insensitively.
std::wstring QueryParam(std::wstring_view query, std::wstring_view name, bool plusAsSpace) {
    size_t hash = query.find(L'#');
    if (hash != std::wstring_view::npos) query = query.substr(0, hash);
    size_t start = 0;
    while (start <= query.size()) {
        size_t end = query.find(L'&', start);
        if (end == std::wstring_view::npos) end = query.size();
        std::wstring_view part = query.substr(start, end - start);
        size_t eq = part.find(L'=');
        std::wstring_view key = eq == std::wstring_view::npos ? part : part.substr(0, eq);
        if (key.size() == name.size() && _wcsnicmp(key.data(), name.data(), name.size()) == 0) {
            return eq == std::wstring_view::npos ? std::wstring() : PercentDecode(part.substr(eq + 1), plusAsSpace);
        }
        start = end + 1;
    }
    return {};
}

// Bing's u=a1<base64url> payload (no padding; '+' may have arrived as a space).
bool Base64UrlDecode(std::wstring_view in, std::string* out) {
    out->clear();
    unsigned buffer = 0;
    int bits = 0;
    for (wchar_t c : in) {
        int v;
        if (c >= L'A' && c <= L'Z') v = c - L'A';
        else if (c >= L'a' && c <= L'z') v = c - L'a' + 26;
        else if (c >= L'0' && c <= L'9') v = c - L'0' + 52;
        else if (c == L'-' || c == L'+' || c == L' ') v = 62;
        else if (c == L'_' || c == L'/') v = 63;
        else if (c == L'=') break;
        else return false;
        buffer = (buffer << 6) | static_cast<unsigned>(v);
        bits += 6;
        if (bits >= 8) {
            bits -= 8;
            *out += static_cast<char>((buffer >> bits) & 0xFF);
        }
    }
    return !out->empty();
}

bool IsHttp(std::wstring_view s) {
    return StartsWithI(s, L"http://") || StartsWithI(s, L"https://");
}

struct UrlParts {
    std::wstring host;   // lowercase, no port or user info
    std::wstring path;   // lowercase, trailing slashes dropped, "/" when empty
    std::wstring query;  // after '?', before '#'
};

bool SplitHttpUrl(std::wstring_view url, UrlParts* parts) {
    if (!IsHttp(url)) return false;
    size_t schemeEnd = url.find(L"://") + 3;
    size_t authEnd = url.find_first_of(L"/?#", schemeEnd);
    if (authEnd == std::wstring_view::npos) authEnd = url.size();
    std::wstring_view authority = url.substr(schemeEnd, authEnd - schemeEnd);
    size_t at = authority.rfind(L'@');
    if (at != std::wstring_view::npos) authority = authority.substr(at + 1);
    if (!authority.empty() && authority.front() != L'[') {
        size_t colon = authority.find(L':');
        if (colon != std::wstring_view::npos) authority = authority.substr(0, colon);
    }
    parts->host = Lower(authority);
    while (!parts->host.empty() && parts->host.back() == L'.') parts->host.pop_back();
    if (parts->host.empty()) return false;
    std::wstring_view rest = url.substr(authEnd);
    size_t q = rest.find_first_of(L"?#");
    std::wstring path = Lower(rest.substr(0, q == std::wstring_view::npos ? rest.size() : q));
    while (!path.empty() && path.back() == L'/') path.pop_back();
    parts->path = path.empty() ? L"/" : path;
    parts->query.clear();
    if (q != std::wstring_view::npos && rest[q] == L'?') {
        std::wstring_view query = rest.substr(q + 1);
        size_t hash = query.find(L'#');
        parts->query = std::wstring(hash == std::wstring_view::npos ? query : query.substr(0, hash));
    }
    return true;
}

bool OnDomain(const std::wstring& host, std::wstring_view domain) {
    if (host == domain) return true;
    return host.size() > domain.size() + 1 && host[host.size() - domain.size() - 1] == L'.' &&
           host.compare(host.size() - domain.size(), domain.size(), domain) == 0;
}

// ---- unwrapping (mirrors LinkUnwrap.js in Luma's open feature) ----

enum class LinkKind { None, Url, Query };

struct Link {
    LinkKind kind = LinkKind::None;
    std::wstring url;    // the target, or the Bing results url for a query
    std::wstring query;  // the search terms
    bool news = false;
};

Link Unwrap(std::wstring_view input) {
    std::wstring cur = Unquote(input);
    if (cur.size() > kMaxLinkLength) return {};
    for (int depth = 0; depth < kMaxDepth; depth++) {
        if (StartsWithI(cur, kSingleArgument)) cur = Unquote(std::wstring_view(cur).substr(kSingleArgument.size()));
        if (StartsWithI(cur, kEdgeScheme)) {
            std::wstring rest = cur.substr(kEdgeScheme.size());
            if (rest.rfind(L"//?", 0) == 0) rest = rest.substr(2);
            else if (rest.rfind(L"/?", 0) == 0) rest = rest.substr(1);
            if (!rest.empty() && rest[0] == L'?') cur = Trim(QueryParam(std::wstring_view(rest).substr(1), L"url", false));
            else if (StartsWithI(rest, L"http%3a") || StartsWithI(rest, L"https%3a")) cur = Trim(PercentDecode(rest, false));
            else cur = Trim(rest);
            if (cur.empty()) return {};
            continue;
        }
        UrlParts parts;
        if (!SplitHttpUrl(cur, &parts)) return {};
        if (OnDomain(parts.host, L"bing.com")) {
            std::wstring next;
            if (parts.path == L"/newtabredir") {
                next = QueryParam(parts.query, L"url", false);
            } else if (parts.path == L"/ck/a" || parts.path == L"/aclick" || parts.path == L"/aclk") {
                std::wstring u = QueryParam(parts.query, L"u", false);
                std::string bytes;
                if (u.rfind(L"a1", 0) == 0) {
                    if (Base64UrlDecode(std::wstring_view(u).substr(2), &bytes)) next = luma::json::FromUtf8(bytes);
                } else {
                    next = u;
                }
            }
            next = Trim(next);
            if (!next.empty() && IsHttp(next)) {
                cur = next;
                continue;
            }
            bool isSearch = parts.path == L"/search" ||
                            (parts.path.size() > 7 && parts.path.compare(parts.path.size() - 7, 7, L"/search") == 0);
            if (isSearch) {
                std::wstring q = Trim(QueryParam(parts.query, L"q", true));
                if (!q.empty()) {
                    Link link;
                    link.kind = LinkKind::Query;
                    link.url = cur;
                    link.query = q;
                    return link;
                }
            }
        }
        Link link;
        link.kind = LinkKind::Url;
        link.url = cur;
        link.news = OnDomain(parts.host, L"msn.com") || OnDomain(parts.host, L"microsoftstart.com");
        return link;
    }
    return {};
}

// ---- which launches are Edge-bound ----

std::wstring BaseNameLower(std::wstring_view path) {
    std::wstring p = Unquote(path);
    size_t slash = p.find_last_of(L"\\/");
    return Lower(slash == std::wstring::npos ? p : p.substr(slash + 1));
}

bool IsEdgeImage(std::wstring_view path) {
    return BaseNameLower(path) == L"msedge.exe";
}

// Splits a command line into its program (first token, quotes honored) and the rest.
void SplitCommandLine(std::wstring_view cmd, std::wstring* program, std::wstring* args) {
    std::wstring c = Trim(cmd);
    size_t end;
    if (!c.empty() && c[0] == L'"') {
        size_t close = c.find(L'"', 1);
        end = close == std::wstring::npos ? c.size() : close + 1;
    } else {
        end = c.find_first_of(L" \t");
        if (end == std::wstring::npos) end = c.size();
    }
    *program = c.substr(0, end);
    *args = end < c.size() ? Trim(std::wstring_view(c).substr(end)) : std::wstring();
}

// The link in msedge.exe's arguments, or empty. Windows starts Edge for a microsoft-edge: link as
// `msedge.exe --single-argument <link>`; a lone link with no switches counts too. Anything else (a profile, an app
// window, InPrivate, a pinned site) is the user starting Edge on purpose and is left alone.
std::wstring LinkFromEdgeArgs(std::wstring_view args) {
    std::wstring a = Trim(args);
    size_t at = FindI(a, kSingleArgument);
    if (at != std::wstring::npos) return Unquote(std::wstring_view(a).substr(at + kSingleArgument.size()));
    a = Unquote(a);
    if (a.empty() || a.find_first_of(L" \t") != std::wstring::npos) return {};
    if (StartsWithI(a, kEdgeScheme) || IsHttp(a)) return a;
    return {};
}

std::wstring Shorten(std::wstring_view s) {
    return s.size() > 300 ? std::wstring(s.substr(0, 300)) + L"..." : std::wstring(s);
}

// ---- deciding and sending ----

struct Decision {
    bool redirect = false;
    std::string body;
    std::wstring what;
};

Decision Decide(std::wstring_view raw) {
    Decision d;
    Link link = Unwrap(raw);
    if (link.kind == LinkKind::None) return d;
    using luma::json::Quote;
    using luma::json::ToUtf8;
    if (link.kind == LinkKind::Query) {
        SearchMode mode = static_cast<SearchMode>(g_searchMode.load());
        if (mode == SearchMode::Edge) return d;
        if (mode == SearchMode::Luma) {
            d.body = "{\"query\":" + Quote(ToUtf8(link.query)) + "}";
            d.what = L"search \"" + link.query + L"\"";
        } else {
            d.body = "{\"url\":" + Quote(ToUtf8(link.url)) + ",\"unwrap\":false}";
            d.what = L"Bing " + link.url;
        }
    } else {
        if (link.news ? !g_redirectNews.load() : !g_redirectOther.load()) return d;
        d.body = "{\"url\":" + Quote(ToUtf8(link.url)) + ",\"unwrap\":false}";
        d.what = (link.news ? L"news " : L"link ") + link.url;
    }
    d.redirect = true;
    return d;
}

using ShellExecuteExW_t = BOOL(WINAPI*)(SHELLEXECUTEINFOW*);
using ShellExecuteW_t = HINSTANCE(WINAPI*)(HWND, LPCWSTR, LPCWSTR, LPCWSTR, LPCWSTR, INT);
using CreateProcessW_t = BOOL(WINAPI*)(LPCWSTR, LPWSTR, LPSECURITY_ATTRIBUTES, LPSECURITY_ATTRIBUTES, BOOL, DWORD, LPVOID,
                                       LPCWSTR, LPSTARTUPINFOW, LPPROCESS_INFORMATION);
using CreateProcessAsUserW_t = BOOL(WINAPI*)(HANDLE, LPCWSTR, LPWSTR, LPSECURITY_ATTRIBUTES, LPSECURITY_ATTRIBUTES, BOOL,
                                             DWORD, LPVOID, LPCWSTR, LPSTARTUPINFOW, LPPROCESS_INFORMATION);

ShellExecuteExW_t ShellExecuteExW_Original = nullptr;
ShellExecuteW_t ShellExecuteW_Original = nullptr;
CreateProcessW_t CreateProcessW_Original = nullptr;
CreateProcessAsUserW_t CreateProcessAsUserW_Original = nullptr;

// What it takes to run a skipped launch after all, the usual way.
struct Replay {
    bool shell = true;
    std::wstring verb, file, params, dir;  // shell
    int show = SW_SHOWNORMAL;
    std::wstring app, cmd;                 // process (dir shared)
    bool hasApp = false, hasCmd = false, hasDir = false;
    DWORD flags = 0;
};

// The last link handed back to Windows. If replaying it reaches a hook again on some other thread, it is let
// through instead of going round to Luma again.
std::mutex g_replayMutex;
std::string g_replayedBody;
ULONGLONG g_replayedAt = 0;
constexpr ULONGLONG kReplayGraceMs = 15000;

void RememberReplay(const std::string& body) {
    std::lock_guard<std::mutex> lock(g_replayMutex);
    g_replayedBody = body;
    g_replayedAt = GetTickCount64();
}

bool RecentlyReplayed(const std::string& body) {
    std::lock_guard<std::mutex> lock(g_replayMutex);
    return !g_replayedBody.empty() && g_replayedBody == body && GetTickCount64() - g_replayedAt < kReplayGraceMs;
}

void RunReplay(const Replay& r) {
    g_inReplay = true;
    if (r.shell && ShellExecuteExW_Original) {
        HRESULT hr = CoInitializeEx(nullptr, COINIT_APARTMENTTHREADED | COINIT_DISABLE_OLE1DDE);
        SHELLEXECUTEINFOW sei = {};
        sei.cbSize = sizeof(sei);
        sei.fMask = SEE_MASK_NOASYNC | SEE_MASK_FLAG_NO_UI;
        sei.lpVerb = r.verb.empty() ? nullptr : r.verb.c_str();
        sei.lpFile = r.file.c_str();
        sei.lpParameters = r.params.empty() ? nullptr : r.params.c_str();
        sei.lpDirectory = r.hasDir ? r.dir.c_str() : nullptr;
        sei.nShow = r.show;
        ShellExecuteExW_Original(&sei);
        if (SUCCEEDED(hr)) CoUninitialize();
    } else if (!r.shell && CreateProcessW_Original) {
        std::wstring cmd = r.cmd;
        STARTUPINFOW si = {};
        si.cb = sizeof(si);
        PROCESS_INFORMATION pi = {};
        DWORD flags = r.flags & ~static_cast<DWORD>(CREATE_SUSPENDED | EXTENDED_STARTUPINFO_PRESENT | CREATE_UNICODE_ENVIRONMENT);
        if (CreateProcessW_Original(r.hasApp ? r.app.c_str() : nullptr, r.hasCmd ? cmd.data() : nullptr, nullptr, nullptr, FALSE,
                                    flags, nullptr, r.hasDir ? r.dir.c_str() : nullptr, &si, &pi)) {
            CloseHandle(pi.hThread);
            CloseHandle(pi.hProcess);
        }
    }
    g_inReplay = false;
}

// Posts the link to Luma in the background. true: the caller skips the original launch (Luma is up with the open
// feature on and the request is queued); if Luma then does not accept it, the launch is replayed.
bool SendToLuma(const Decision& d, std::shared_ptr<Replay> replay, const wchar_t* via) {
    if (RecentlyReplayed(d.body)) {
        if (g_verbose) Wh_Log(L"[%s] %s was just handed back to Windows; letting it through", via, Shorten(d.what).c_str());
        return false;
    }
    if (!luma::HasFeature("open")) {
        if (g_verbose) Wh_Log(L"[%s] Luma is not running or Open in Luma is off; leaving %s to Edge", via, Shorten(d.what).c_str());
        return false;
    }
    // This process owns the foreground (the click happened here), so it can hand it to Luma.
    luma::AllowForeground();
    std::wstring what = d.what;
    std::wstring from = via;
    std::string body = d.body;
    bool queued = luma::PostAsync(L"/open/", d.body, [replay, what, from, body](const luma::Response& r) {
        bool accepted = false;
        if (r.ok()) luma::json::GetBool(r.body, "success", &accepted);
        if (accepted) {
            Wh_Log(L"[%s] opened in Luma: %s", from.c_str(), Shorten(what).c_str());
            return;
        }
        Wh_Log(L"[%s] Luma did not take %s (HTTP %d, error %u); opening it the usual way", from.c_str(),
               Shorten(what).c_str(), r.status, r.error);
        try {
            RememberReplay(body);
            RunReplay(*replay);
        } catch (...) {
        }
    });
    if (!queued) Wh_Log(L"[%s] could not queue the request; leaving %s to Edge", via, Shorten(d.what).c_str());
    return queued;
}

// ---- hooks ----

bool Active() {
    return !g_inReplay && g_processEnabled.load();
}

bool ShellVerbIsOpen(LPCWSTR verb) {
    return !verb || !*verb || _wcsicmp(verb, L"open") == 0;
}

// true when the launch went to Luma and the caller must report success without running it.
bool TryRedirectShell(const SHELLEXECUTEINFOW* info, const wchar_t* via) {
    // Without the original ShellExecuteExW a skipped launch could not be replayed.
    if (!ShellExecuteExW_Original) return false;
    if (!info || info->cbSize < sizeof(SHELLEXECUTEINFOW) || !info->lpFile || !ShellVerbIsOpen(info->lpVerb)) return false;
    if (info->fMask & (SEE_MASK_CLASSNAME | SEE_MASK_CLASSKEY)) return false;
    std::wstring file = Unquote(info->lpFile);
    std::wstring link;
    if (StartsWithI(file, kEdgeScheme)) link = file;
    else if (IsEdgeImage(file)) link = LinkFromEdgeArgs(info->lpParameters ? info->lpParameters : L"");
    if (link.empty()) return false;
    Decision d = Decide(link);
    if (!d.redirect) {
        if (g_verbose) Wh_Log(L"[%s] letting through: %s", via, Shorten(link).c_str());
        return false;
    }
    auto replay = std::make_shared<Replay>();
    replay->shell = true;
    replay->verb = info->lpVerb ? info->lpVerb : L"";
    replay->file = info->lpFile;
    replay->params = info->lpParameters ? info->lpParameters : L"";
    replay->hasDir = info->lpDirectory != nullptr;
    replay->dir = info->lpDirectory ? info->lpDirectory : L"";
    replay->show = info->nShow;
    return SendToLuma(d, replay, via);
}

bool TryRedirectProcess(LPCWSTR app, LPCWSTR cmd, DWORD flags, LPCWSTR dir, const wchar_t* via) {
    if (!CreateProcessW_Original) return false;
    std::wstring program;
    std::wstring args;
    SplitCommandLine(cmd ? cmd : L"", &program, &args);
    if (!IsEdgeImage(app ? std::wstring_view(app) : std::wstring_view(program))) return false;
    std::wstring link = LinkFromEdgeArgs(args);
    if (link.empty()) return false;
    Decision d = Decide(link);
    if (!d.redirect) {
        if (g_verbose) Wh_Log(L"[%s] letting through: %s", via, Shorten(link).c_str());
        return false;
    }
    auto replay = std::make_shared<Replay>();
    replay->shell = false;
    replay->hasApp = app != nullptr;
    replay->app = app ? app : L"";
    replay->hasCmd = cmd != nullptr;
    replay->cmd = cmd ? cmd : L"";
    replay->hasDir = dir != nullptr;
    replay->dir = dir ? dir : L"";
    replay->flags = flags;
    return SendToLuma(d, replay, via);
}

BOOL WINAPI ShellExecuteExW_Hook(SHELLEXECUTEINFOW* info) {
    if (Active()) {
        try {
            if (TryRedirectShell(info, L"ShellExecuteExW")) {
                info->hInstApp = reinterpret_cast<HINSTANCE>(static_cast<INT_PTR>(42));
                if (info->fMask & SEE_MASK_NOCLOSEPROCESS) info->hProcess = nullptr;
                SetLastError(ERROR_SUCCESS);
                return TRUE;
            }
        } catch (...) {
        }
    }
    return ShellExecuteExW_Original(info);
}

HINSTANCE WINAPI ShellExecuteW_Hook(HWND hwnd, LPCWSTR verb, LPCWSTR file, LPCWSTR params, LPCWSTR dir, INT show) {
    if (Active() && file) {
        try {
            SHELLEXECUTEINFOW sei = {};
            sei.cbSize = sizeof(sei);
            sei.hwnd = hwnd;
            sei.lpVerb = verb;
            sei.lpFile = file;
            sei.lpParameters = params;
            sei.lpDirectory = dir;
            sei.nShow = show;
            if (TryRedirectShell(&sei, L"ShellExecuteW")) return reinterpret_cast<HINSTANCE>(static_cast<INT_PTR>(42));
        } catch (...) {
        }
    }
    return ShellExecuteW_Original(hwnd, verb, file, params, dir, show);
}

// A skipped process launch fails with ERROR_CANCELLED, the code shell callers treat as "the user canceled" (no
// error dialog). Faking success would hand the caller process handles it might wait on.
BOOL WINAPI CreateProcessW_Hook(LPCWSTR app, LPWSTR cmd, LPSECURITY_ATTRIBUTES pa, LPSECURITY_ATTRIBUTES ta, BOOL inherit,
                                DWORD flags, LPVOID env, LPCWSTR dir, LPSTARTUPINFOW si, LPPROCESS_INFORMATION pi) {
    if (Active()) {
        try {
            if (TryRedirectProcess(app, cmd, flags, dir, L"CreateProcessW")) {
                SetLastError(ERROR_CANCELLED);
                return FALSE;
            }
        } catch (...) {
        }
    }
    return CreateProcessW_Original(app, cmd, pa, ta, inherit, flags, env, dir, si, pi);
}

BOOL WINAPI CreateProcessAsUserW_Hook(HANDLE token, LPCWSTR app, LPWSTR cmd, LPSECURITY_ATTRIBUTES pa,
                                      LPSECURITY_ATTRIBUTES ta, BOOL inherit, DWORD flags, LPVOID env, LPCWSTR dir,
                                      LPSTARTUPINFOW si, LPPROCESS_INFORMATION pi) {
    if (Active()) {
        try {
            if (TryRedirectProcess(app, cmd, flags, dir, L"CreateProcessAsUserW")) {
                SetLastError(ERROR_CANCELLED);
                return FALSE;
            }
        } catch (...) {
        }
    }
    return CreateProcessAsUserW_Original(token, app, cmd, pa, ta, inherit, flags, env, dir, si, pi);
}

// ---- settings ----

std::wstring ReadString(PCWSTR name) {
    PCWSTR value = Wh_GetStringSetting(name);
    std::wstring out = value ? value : L"";
    if (value) Wh_FreeStringSetting(value);
    return out;
}

bool ProcessListed(const std::wstring& list, const std::wstring& self) {
    std::wstring all = Trim(list);
    if (all.empty()) return true;
    size_t start = 0;
    while (start <= all.size()) {
        size_t end = all.find_first_of(L",;", start);
        if (end == std::wstring::npos) end = all.size();
        std::wstring name = Lower(Trim(std::wstring_view(all).substr(start, end - start)));
        if (!name.empty() && name == self) return true;
        start = end + 1;
    }
    return false;
}

void LoadSettings() {
    std::wstring mode = ReadString(L"searchMode");
    SearchMode searchMode = SearchMode::Luma;
    if (_wcsicmp(mode.c_str(), L"bing") == 0) searchMode = SearchMode::Bing;
    else if (_wcsicmp(mode.c_str(), L"edge") == 0) searchMode = SearchMode::Edge;
    g_searchMode = static_cast<int>(searchMode);
    g_redirectNews = Wh_GetIntSetting(L"redirectNews") != 0;
    g_redirectOther = Wh_GetIntSetting(L"redirectOtherLinks") != 0;
    g_verbose = Wh_GetIntSetting(L"verboseLog") != 0;
    g_processEnabled = ProcessListed(ReadString(L"processes"), Lower(g_processName));

    luma::Config config;
    config.clientName = L"windhawk-luma-link-redirect/1.0";
    int timeout = Wh_GetIntSetting(L"timeoutMs");
    if (timeout >= 500 && timeout <= 10000) config.totalTimeoutMs = static_cast<DWORD>(timeout);
    else config.totalTimeoutMs = 2500;
    config.apiKey = ReadString(L"apiKey");
    luma::Configure(config);
}

template <typename T>
bool Hook(HMODULE module, const char* name, T hook, T* original) {
    void* target = module ? reinterpret_cast<void*>(GetProcAddress(module, name)) : nullptr;
    if (!target) {
        Wh_Log(L"%S not found", name);
        return false;
    }
    return Wh_SetFunctionHook(target, reinterpret_cast<void*>(hook), reinterpret_cast<void**>(original));
}

}  // namespace

BOOL Wh_ModInit() {
    wchar_t path[MAX_PATH] = L"";
    GetModuleFileNameW(nullptr, path, ARRAYSIZE(path));
    std::wstring base = BaseNameLower(path);
    wcsncpy_s(g_processName, base.c_str(), _TRUNCATE);
    LoadSettings();
    Wh_Log(L"Init in %s (%s)", g_processName, g_processEnabled ? L"active" : L"not in the process list");

    HMODULE kernelBase = GetModuleHandleW(L"kernelbase.dll");
    HMODULE shell32 = LoadLibraryExW(L"shell32.dll", nullptr, LOAD_LIBRARY_SEARCH_SYSTEM32);
    bool any = false;
    any |= Hook(shell32, "ShellExecuteExW", &ShellExecuteExW_Hook, &ShellExecuteExW_Original);
    any |= Hook(shell32, "ShellExecuteW", &ShellExecuteW_Hook, &ShellExecuteW_Original);
    any |= Hook(kernelBase, "CreateProcessW", &CreateProcessW_Hook, &CreateProcessW_Original);
    any |= Hook(kernelBase, "CreateProcessAsUserW", &CreateProcessAsUserW_Hook, &CreateProcessAsUserW_Original);
    return any ? TRUE : FALSE;
}

void Wh_ModSettingsChanged() {
    LoadSettings();
    Wh_Log(L"Settings changed in %s (%s)", g_processName, g_processEnabled ? L"active" : L"not in the process list");
}

void Wh_ModUninit() {
    Wh_Log(L"Uninit");
    g_processEnabled = false;
    luma::Shutdown();
}

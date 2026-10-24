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

package com.lumabyte.luma.bridge

import com.google.gson.Gson
import com.google.gson.JsonElement
import com.google.gson.JsonNull
import com.google.gson.JsonObject
import com.google.gson.JsonParser
import com.intellij.openapi.diagnostic.Logger
import java.net.URI
import java.net.http.HttpClient
import java.net.http.WebSocket
import java.time.Duration
import java.util.concurrent.CompletionStage
import java.util.concurrent.TimeUnit

class BridgeClient(
    private val handshake: Handshake,
    private val onFrame: (type: String, payload: JsonElement) -> Unit,
    private val onClosed: (reason: String?) -> Unit,
) {
    private val log = Logger.getInstance(BridgeClient::class.java)
    private val gson = Gson()
    private var ws: WebSocket? = null
    @Volatile var closed = false
        private set

    fun connect() {
        val client = HttpClient.newBuilder().version(HttpClient.Version.HTTP_1_1).connectTimeout(Duration.ofSeconds(5)).proxy(HttpClient.Builder.NO_PROXY).build()
        val listener = object : WebSocket.Listener {
            private val partial = StringBuilder()
            override fun onOpen(webSocket: WebSocket) {
                webSocket.request(1)
            }

            override fun onText(webSocket: WebSocket, data: CharSequence, last: Boolean): CompletionStage<*>? {
                partial.append(data)
                if (last) {
                    val text = partial.toString()
                    partial.setLength(0)
                    handle(text)
                }
                webSocket.request(1)
                return null
            }

            override fun onClose(webSocket: WebSocket, statusCode: Int, reason: String): CompletionStage<*>? {
                markClosed(if (reason.isBlank()) "closed ($statusCode)" else reason)
                return null
            }

            override fun onError(webSocket: WebSocket, error: Throwable) {
                log.info("bridge socket error: ${error.message}")
                markClosed(error.message)
            }
        }
        try {
            ws = client.newWebSocketBuilder()
                .header("Authorization", "Bearer ${handshake.token}")
                .connectTimeout(Duration.ofSeconds(5))
                .buildAsync(URI.create(handshake.wsUrl), listener)
                .get(8, TimeUnit.SECONDS)
        } catch (e: Exception) {
            val cause = e.cause ?: e
            val msg = cause.message ?: cause.javaClass.simpleName
            closed = true
            throw IllegalStateException(
                if (msg.contains("401")) "LumaBrowser refused the connection (stale token). Restart the app and reconnect."
                else "Could not open the LumaBrowser bridge: $msg",
            )
        }
    }

    private fun handle(text: String) {
        val obj = try {
            JsonParser.parseString(text).asJsonObject
        } catch (_: Exception) {
            return
        }
        val type = obj.get("type")?.takeIf { it.isJsonPrimitive }?.asString ?: return
        val payload: JsonElement = obj.get("payload") ?: JsonNull.INSTANCE
        try {
            onFrame(type, payload)
        } catch (e: Exception) {
            log.warn("frame handler failed for $type", e)
        }
    }

    private fun markClosed(reason: String?) {
        if (closed) return
        closed = true
        try {
            onClosed(reason)
        } catch (_: Exception) {}
    }

    fun send(type: String, payload: JsonElement? = null): Boolean {
        val socket = ws ?: return false
        if (closed) return false
        val frame = JsonObject()
        frame.addProperty("type", type)
        frame.add("payload", payload ?: JsonObject())
        return try {
            socket.sendText(gson.toJson(frame), true)
            true
        } catch (e: Exception) {
            log.info("bridge send failed: ${e.message}")
            false
        }
    }

    fun close() {
        val socket = ws ?: return
        closed = true
        try {
            socket.sendClose(WebSocket.NORMAL_CLOSURE, "bye")
        } catch (_: Exception) {}
        try {
            socket.abort()
        } catch (_: Exception) {}
    }
}

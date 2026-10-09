package com.lumabyte.luma.bridge

import com.google.gson.JsonParser
import java.io.File
import java.net.URI
import java.net.http.HttpClient
import java.net.http.HttpRequest
import java.net.http.HttpResponse
import java.time.Duration

data class Handshake(val port: Int, val token: String, val version: String?, val pid: Int?) {
    val wsUrl: String get() = "ws://127.0.0.1:$port/api/ext/code-mode/terminal?token=$token"
    val healthUrl: String get() = "http://127.0.0.1:$port/api/health"

    companion object {
        val file: File
            get() {
                val override = System.getenv("LUMA_CLI_HANDSHAKE")
                if (!override.isNullOrBlank()) return File(override.trim())
                return File(System.getProperty("user.home"), ".lumabrowser${File.separator}cli.json")
            }

        fun read(): Handshake? {
            val f = file
            if (!f.isFile) return null
            return try {
                val j = JsonParser.parseString(f.readText()).asJsonObject
                val port = j.get("port")?.takeIf { it.isJsonPrimitive }?.asInt ?: return null
                val token = j.get("token")?.takeIf { it.isJsonPrimitive }?.asString ?: return null
                Handshake(
                    port, token,
                    j.get("version")?.takeIf { it.isJsonPrimitive }?.asString,
                    j.get("pid")?.takeIf { it.isJsonPrimitive }?.asInt,
                )
            } catch (_: Exception) {
                null
            }
        }

        private val http: HttpClient by lazy {
            HttpClient.newBuilder().version(HttpClient.Version.HTTP_1_1).connectTimeout(Duration.ofSeconds(2)).proxy(HttpClient.Builder.NO_PROXY).build()
        }

        fun healthy(hs: Handshake): Boolean = try {
            val req = HttpRequest.newBuilder(URI.create(hs.healthUrl)).timeout(Duration.ofSeconds(2)).GET().build()
            http.send(req, HttpResponse.BodyHandlers.discarding()).statusCode() == 200
        } catch (_: Exception) {
            false
        }
    }
}

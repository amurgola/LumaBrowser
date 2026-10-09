package com.lumabyte.luma.bridge

import com.google.gson.JsonParser
import com.intellij.openapi.diagnostic.Logger
import com.intellij.openapi.util.SystemInfo
import com.lumabyte.luma.settings.LumaSettings
import java.io.File

object AppLauncher {
    private val log = Logger.getInstance(AppLauncher::class.java)
    private const val START_WAIT_MS = 60_000L

    fun executable(): File? {
        val fromSettings = LumaSettings.instance.state.appExecutable
        if (!fromSettings.isNullOrBlank()) {
            val f = File(fromSettings.trim())
            if (f.exists()) return f
        }
        System.getenv("LUMA_APP_EXE")?.let { val f = File(it); if (f.exists()) return f }
        for (c in defaultCandidates()) if (c.exists()) return c
        val install = File(System.getProperty("user.home"), ".lumabrowser${File.separator}install.json")
        if (install.isFile) {
            try {
                val j = JsonParser.parseString(install.readText()).asJsonObject
                val exe = j.get("executable")?.takeIf { it.isJsonPrimitive }?.asString
                if (!exe.isNullOrBlank() && File(exe).exists()) return File(exe)
            } catch (_: Exception) {}
        }
        return null
    }

    private fun defaultCandidates(): List<File> {
        val home = System.getProperty("user.home")
        return when {
            SystemInfo.isWindows -> {
                val local = System.getenv("LOCALAPPDATA") ?: "$home\\AppData\\Local"
                val pf = System.getenv("ProgramFiles") ?: "C:\\Program Files"
                listOf(
                    File(local, "Programs\\LumaBrowser\\LumaBrowser.exe"),
                    File(local, "Programs\\lumabrowser\\LumaBrowser.exe"),
                    File(pf, "LumaBrowser\\LumaBrowser.exe"),
                )
            }
            SystemInfo.isMac -> listOf(
                File("/Applications/LumaBrowser.app"),
                File(home, "Applications/LumaBrowser.app"),
            )
            else -> listOf(
                File("/opt/LumaBrowser/lumabrowser"),
                File("/usr/bin/lumabrowser"),
                File("/usr/local/bin/lumabrowser"),
                File(home, ".local/bin/lumabrowser"),
            )
        }
    }

    fun startAndWait(onProgress: (String) -> Unit = {}): Handshake {
        val exe = executable() ?: throw IllegalStateException(
            "LumaBrowser is not running and no installation was found. Start it yourself, or set its location under Settings > Tools > LumaBrowser.",
        )
        val before = Handshake.read()?.token
        onProgress("Starting LumaBrowser…")
        log.info("starting LumaBrowser: ${exe.absolutePath}")
        launch(exe)
        val deadline = System.currentTimeMillis() + START_WAIT_MS
        while (System.currentTimeMillis() < deadline) {
            Thread.sleep(1000)
            val hs = Handshake.read()
            if (hs != null && hs.token != before && Handshake.healthy(hs)) return hs
        }
        throw IllegalStateException("LumaBrowser did not come up within 60 seconds.")
    }

    private fun launch(exe: File) {
        val cmd = if (SystemInfo.isMac && exe.name.endsWith(".app")) {
            listOf("open", "-a", exe.absolutePath, "--args", "--hidden")
        } else {
            listOf(exe.absolutePath, "--hidden")
        }
        val pb = ProcessBuilder(cmd)
        pb.environment().remove("ELECTRON_RUN_AS_NODE")
        pb.redirectErrorStream(true)
        pb.redirectOutput(ProcessBuilder.Redirect.DISCARD)
        pb.redirectInput(ProcessBuilder.Redirect.PIPE)
        try {
            pb.start()
        } catch (e: Exception) {
            log.warn("LumaBrowser launch failed", e)
            throw IllegalStateException("Could not start LumaBrowser (${exe.absolutePath}): ${e.message}")
        }
    }
}

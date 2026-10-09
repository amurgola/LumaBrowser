import org.jetbrains.kotlin.gradle.dsl.JvmTarget


fun env(key: String) = providers.environmentVariable(key)

plugins {
    id("java")
    kotlin("jvm") version "2.4.20"
    id("org.jetbrains.intellij.platform") version "2.18.1"
}

group = providers.gradleProperty("pluginGroup").get()
version = providers.gradleProperty("pluginVersion").get()

repositories {
    mavenCentral()
    intellijPlatform {
        defaultRepositories()
    }
}

dependencies {
    intellijPlatform {
        val localIde = env("LUMA_IDE_HOME").orNull
        if (!localIde.isNullOrBlank()) {
            local(localIde)
            if (file("$localIde/plugins/jcef-plugin").isDirectory) {
                bundledPlugin("com.intellij.modules.jcef")
            }
        } else {
            intellijIdeaCommunity(providers.gradleProperty("platformVersion").get())
        }
    }
}

java {
    sourceCompatibility = JavaVersion.VERSION_21
    targetCompatibility = JavaVersion.VERSION_21
}
kotlin {
    compilerOptions {
        jvmTarget.set(JvmTarget.JVM_21)
    }
}

intellijPlatform {
    buildSearchableOptions = false
    pluginConfiguration {
        id = "com.lumabyte.luma"
        name = "LumaBrowser"
        version = project.version.toString()
        description = providers.fileContents(layout.projectDirectory.file("README.md")).asText.map {
            it.substringAfter("<!-- Plugin description -->").substringBefore("<!-- Plugin description end -->").trim()
        }
        ideaVersion {
            sinceBuild = "243"
            untilBuild = provider { null }
        }
        vendor {
            name = "Lumabyte, LLC"
            url = "https://lumabyte.com"
        }
    }
}

tasks {
    test { enabled = false }

    runIde {
        val projectDir = env("LUMA_RUN_PROJECT").orNull
        if (!projectDir.isNullOrBlank()) {
            argumentProviders += CommandLineArgumentProvider { listOf(projectDir) }
            jvmArgumentProviders += CommandLineArgumentProvider {
                listOf(
                    "-Didea.trust.all.projects=true",
                    "-Djb.consents.confirmation.enabled=false",
                    "-Djb.privacy.policy.text=<!--999.999-->",
                    "-Didea.initially.ask.config=never",
                )
            }
        }
    }
}

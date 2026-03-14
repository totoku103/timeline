import org.springframework.boot.gradle.tasks.bundling.BootJar

plugins {
    java
    id("org.springframework.boot") version "4.0.3" apply false
}

val javaVersion: String by project
val springBootVersion = "4.0.3"

subprojects {
    apply(plugin = "java")

    group = "com.timeline"
    version = "0.0.1-SNAPSHOT"

    java {
        toolchain {
            languageVersion = JavaLanguageVersion.of(javaVersion.toInt())
        }
    }

    repositories {
        mavenCentral()
    }

    dependencies {
        // Spring Boot BOM
        val bom = platform("org.springframework.boot:spring-boot-dependencies:$springBootVersion")
        implementation(bom)
        annotationProcessor(bom)

        // Lombok - available to all subprojects
        compileOnly("org.projectlombok:lombok")
        annotationProcessor("org.projectlombok:lombok")

        // Testing
        testImplementation("org.springframework.boot:spring-boot-starter-test")
    }

    tasks.withType<Test> {
        useJUnitPlatform()
    }

    // Disable plain jar and bootJar by default; only timeline-api needs bootJar
    tasks.withType<BootJar> {
        enabled = false
    }
    tasks.withType<Jar> {
        enabled = true
    }
}

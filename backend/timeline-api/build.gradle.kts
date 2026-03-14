plugins {
    java
    id("org.springframework.boot")
    id("org.asciidoctor.jvm.convert") version "4.0.3"
}

// Re-enable bootJar for the runnable module
tasks.withType<org.springframework.boot.gradle.tasks.bundling.BootJar> {
    enabled = true
}

val snippetsDir = file("build/generated-snippets")

dependencies {
    implementation(project(":timeline-core"))
    implementation(project(":timeline-infra"))

    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-validation")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")

    testImplementation("org.springframework.restdocs:spring-restdocs-mockmvc")
    testImplementation("org.springframework.boot:spring-boot-starter-webmvc-test")
}

tasks.test {
    outputs.dir(snippetsDir)
}

tasks.asciidoctor {
    inputs.dir(snippetsDir)
    dependsOn(tasks.test)
    baseDirFollowsSourceFile()
}

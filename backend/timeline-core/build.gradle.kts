plugins {
    java
}

dependencies {
    // timeline-core is pure domain — no Spring Web, no JPA
    // Only bring in validation API if needed for domain constraints
    implementation("jakarta.validation:jakarta.validation-api")

    // JUnit 5 for unit tests (no Spring context needed)
    testImplementation("org.junit.jupiter:junit-jupiter")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
}

package com.timeline.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = "com.timeline")
public class TimelineApplication {

    public static void main(String[] args) {
        SpringApplication.run(TimelineApplication.class, args);
    }
}

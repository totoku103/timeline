package com.timeline.core.domain;

public record Country(Long id, String name, String code) {
    public Country {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("country name must not be blank");
        }
        if (code == null || code.isBlank()) {
            throw new IllegalArgumentException("country code must not be blank");
        }
    }
}

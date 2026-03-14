package com.timeline.core.domain;

import java.time.LocalDateTime;

public record Category(
        Long id,
        String name,
        String description,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        String createdBy,
        String updatedBy
) {
    public Category {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("category name must not be blank");
        }
    }
}

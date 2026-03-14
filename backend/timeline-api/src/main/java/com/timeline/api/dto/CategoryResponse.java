package com.timeline.api.dto;

import com.timeline.core.domain.Category;

import java.time.LocalDateTime;

public record CategoryResponse(
        Long id,
        String name,
        String description,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        String createdBy,
        String updatedBy
) {
    public static CategoryResponse from(Category domain) {
        return new CategoryResponse(
                domain.id(),
                domain.name(),
                domain.description(),
                domain.createdAt(),
                domain.updatedAt(),
                domain.createdBy(),
                domain.updatedBy()
        );
    }
}

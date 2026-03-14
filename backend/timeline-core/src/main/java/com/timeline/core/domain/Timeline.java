package com.timeline.core.domain;

import java.time.LocalDateTime;
import java.util.List;

public record Timeline(
        Long id,
        String title,
        String description,
        List<Category> categories,
        long eventYear,
        PrecisionLevel precisionLevel,
        Integer eventMonth,
        Integer eventDay,
        int sortOrder,
        LocalDateTime eventLocalDateTime,
        LocalDateTime eventUtcDateTime,
        String timeZone,
        Long uncertaintyYears,
        String location,
        String source,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        String createdBy,
        String updatedBy,
        EventType eventType,
        Long endYear,
        Integer endMonth,
        Integer endDay
) {
    public Timeline {
        if (title == null || title.isBlank()) {
            throw new IllegalArgumentException("title must not be blank");
        }
        if (precisionLevel == null) {
            throw new IllegalArgumentException("precisionLevel must not be null");
        }
        if (eventType == null) {
            eventType = EventType.POINT;
        }
        if (categories == null) {
            categories = List.of();
        }
    }
}

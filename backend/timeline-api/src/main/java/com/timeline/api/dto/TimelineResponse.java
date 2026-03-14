package com.timeline.api.dto;

import com.timeline.core.domain.EventType;
import com.timeline.core.domain.PrecisionLevel;
import com.timeline.core.domain.Timeline;

import java.time.LocalDateTime;

public record TimelineResponse(
        Long id,
        String title,
        String description,
        Long categoryId,
        String categoryName,
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
    public static TimelineResponse from(Timeline domain) {
        return new TimelineResponse(
                domain.id(),
                domain.title(),
                domain.description(),
                domain.category().id(),
                domain.category().name(),
                domain.eventYear(),
                domain.precisionLevel(),
                domain.eventMonth(),
                domain.eventDay(),
                domain.sortOrder(),
                domain.eventLocalDateTime(),
                domain.eventUtcDateTime(),
                domain.timeZone(),
                domain.uncertaintyYears(),
                domain.location(),
                domain.source(),
                domain.createdAt(),
                domain.updatedAt(),
                domain.createdBy(),
                domain.updatedBy(),
                domain.eventType(),
                domain.endYear(),
                domain.endMonth(),
                domain.endDay()
        );
    }
}

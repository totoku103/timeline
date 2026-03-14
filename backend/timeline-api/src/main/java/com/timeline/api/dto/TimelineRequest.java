package com.timeline.api.dto;

import com.timeline.core.domain.EventType;
import com.timeline.core.domain.PrecisionLevel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;
import java.util.List;

public record TimelineRequest(
        @NotBlank String title,
        String description,
        @NotEmpty List<Long> categoryIds,
        @NotNull Long eventYear,
        @NotNull PrecisionLevel precisionLevel,
        Integer eventMonth,
        Integer eventDay,
        Integer sortOrder,
        LocalDateTime eventLocalDateTime,
        LocalDateTime eventUtcDateTime,
        String timeZone,
        Long uncertaintyYears,
        String location,
        String source,
        EventType eventType,
        Long endYear,
        Integer endMonth,
        Integer endDay
) {
}

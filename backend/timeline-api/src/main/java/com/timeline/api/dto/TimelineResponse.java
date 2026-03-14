package com.timeline.api.dto;

import com.timeline.core.domain.Category;
import com.timeline.core.domain.Country;
import com.timeline.core.domain.EventType;
import com.timeline.core.domain.PrecisionLevel;
import com.timeline.core.domain.Timeline;

import java.time.LocalDateTime;
import java.util.List;

public record TimelineResponse(
        Long id,
        String title,
        String description,
        List<Long> categoryIds,
        List<String> categoryNames,
        List<Long> countryIds,
        List<String> countryNames,
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
        List<Long> categoryIds = domain.categories().stream()
                .map(Category::id)
                .toList();
        List<String> categoryNames = domain.categories().stream()
                .map(Category::name)
                .toList();
        List<Long> countryIds = domain.countries().stream()
                .map(Country::id)
                .toList();
        List<String> countryNames = domain.countries().stream()
                .map(Country::name)
                .toList();
        return new TimelineResponse(
                domain.id(),
                domain.title(),
                domain.description(),
                categoryIds,
                categoryNames,
                countryIds,
                countryNames,
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

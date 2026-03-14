package com.timeline.api.controller;

import com.timeline.api.dto.TimelineRequest;
import com.timeline.api.dto.TimelineResponse;
import com.timeline.core.domain.EventType;
import com.timeline.core.domain.PrecisionLevel;
import com.timeline.core.domain.Timeline;
import com.timeline.core.service.TimelineService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/timelines")
@RequiredArgsConstructor
public class TimelineController {

    private final TimelineService timelineService;

    @GetMapping
    public ResponseEntity<List<TimelineResponse>> findAll() {
        List<TimelineResponse> responses = timelineService.findAll()
                .stream()
                .map(TimelineResponse::from)
                .toList();
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/search")
    public ResponseEntity<List<TimelineResponse>> search(
            @RequestParam(required = false) Long fromYear,
            @RequestParam(required = false) Long toYear,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) PrecisionLevel precisionLevel) {
        List<TimelineResponse> responses = timelineService.search(fromYear, toYear, categoryId, precisionLevel)
                .stream()
                .map(TimelineResponse::from)
                .toList();
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/{id}")
    public ResponseEntity<TimelineResponse> findById(@PathVariable Long id) {
        return timelineService.findById(id)
                .map(TimelineResponse::from)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<TimelineResponse> create(@Valid @RequestBody TimelineRequest request) {
        Timeline domain = new Timeline(
                null,
                request.title(),
                request.description(),
                null,
                null,
                request.eventYear(),
                request.precisionLevel(),
                request.eventMonth(),
                request.eventDay(),
                request.sortOrder() != null ? request.sortOrder() : 0,
                request.eventLocalDateTime(),
                request.eventUtcDateTime(),
                request.timeZone(),
                request.uncertaintyYears(),
                request.location(),
                request.source(),
                null, null, null, null,
                request.eventType() != null ? request.eventType() : EventType.POINT,
                request.endYear(),
                request.endMonth(),
                request.endDay()
        );
        List<Long> countryIds = request.countryIds() != null ? request.countryIds() : List.of();
        TimelineResponse response = TimelineResponse.from(timelineService.create(domain, request.categoryIds(), countryIds));
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<TimelineResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody TimelineRequest request) {
        Timeline domain = new Timeline(
                id,
                request.title(),
                request.description(),
                null,
                null,
                request.eventYear(),
                request.precisionLevel(),
                request.eventMonth(),
                request.eventDay(),
                request.sortOrder() != null ? request.sortOrder() : 0,
                request.eventLocalDateTime(),
                request.eventUtcDateTime(),
                request.timeZone(),
                request.uncertaintyYears(),
                request.location(),
                request.source(),
                null, null, null, null,
                request.eventType() != null ? request.eventType() : EventType.POINT,
                request.endYear(),
                request.endMonth(),
                request.endDay()
        );
        List<Long> countryIds = request.countryIds() != null ? request.countryIds() : List.of();
        TimelineResponse response = TimelineResponse.from(timelineService.update(id, domain, request.categoryIds(), countryIds));
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        timelineService.delete(id);
        return ResponseEntity.noContent().build();
    }
}

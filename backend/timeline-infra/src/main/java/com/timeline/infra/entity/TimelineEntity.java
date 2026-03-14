package com.timeline.infra.entity;

import com.timeline.core.domain.EventType;
import com.timeline.core.domain.PrecisionLevel;
import com.timeline.core.domain.Timeline;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(
        name = "timelines",
        indexes = {
                @Index(name = "idx_event_year", columnList = "event_year, event_month, event_day, sort_order"),
                @Index(name = "idx_event_year_precision", columnList = "event_year, precision_level")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class TimelineEntity extends BaseEntity {

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "timeline_categories",
            joinColumns = @JoinColumn(name = "timeline_id"),
            inverseJoinColumns = @JoinColumn(name = "category_id")
    )
    @Builder.Default
    private List<CategoryEntity> categories = new ArrayList<>();

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "timeline_countries",
            joinColumns = @JoinColumn(name = "timeline_id"),
            inverseJoinColumns = @JoinColumn(name = "country_id")
    )
    @Builder.Default
    private List<CountryEntity> countries = new ArrayList<>();

    @Column(name = "event_year", nullable = false)
    private long eventYear;

    @Enumerated(EnumType.STRING)
    @Column(name = "precision_level", nullable = false)
    private PrecisionLevel precisionLevel;

    @Column(name = "event_month")
    private Integer eventMonth;

    @Column(name = "event_day")
    private Integer eventDay;

    @Column(name = "sort_order", nullable = false, columnDefinition = "int default 0")
    @Builder.Default
    private int sortOrder = 0;

    @Column(name = "event_local_date_time")
    private LocalDateTime eventLocalDateTime;

    @Column(name = "event_utc_date_time")
    private LocalDateTime eventUtcDateTime;

    @Column(name = "time_zone")
    private String timeZone;

    @Column(name = "uncertainty_years")
    private Long uncertaintyYears;

    @Column
    private String location;

    @Column
    private String source;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false, columnDefinition = "varchar(10) default 'POINT'")
    @Builder.Default
    private EventType eventType = EventType.POINT;

    @Column(name = "end_year")
    private Long endYear;

    @Column(name = "end_month")
    private Integer endMonth;

    @Column(name = "end_day")
    private Integer endDay;

    public Timeline toDomain() {
        return new Timeline(
                getId(),
                title,
                description,
                categories.stream().map(CategoryEntity::toDomain).distinct().toList(),
                countries.stream().map(CountryEntity::toDomain).distinct().toList(),
                eventYear,
                precisionLevel,
                eventMonth,
                eventDay,
                sortOrder,
                eventLocalDateTime,
                eventUtcDateTime,
                timeZone,
                uncertaintyYears,
                location,
                source,
                getCreatedAt(),
                getUpdatedAt(),
                getCreatedBy(),
                getUpdatedBy(),
                eventType,
                endYear,
                endMonth,
                endDay
        );
    }

    public static TimelineEntity fromDomain(Timeline domain, List<CategoryEntity> categoryEntities, List<CountryEntity> countryEntities) {
        TimelineEntity entity = TimelineEntity.builder()
                .title(domain.title())
                .description(domain.description())
                .eventYear(domain.eventYear())
                .precisionLevel(domain.precisionLevel())
                .eventMonth(domain.eventMonth())
                .eventDay(domain.eventDay())
                .sortOrder(domain.sortOrder())
                .eventLocalDateTime(domain.eventLocalDateTime())
                .eventUtcDateTime(domain.eventUtcDateTime())
                .timeZone(domain.timeZone())
                .uncertaintyYears(domain.uncertaintyYears())
                .location(domain.location())
                .source(domain.source())
                .eventType(domain.eventType() != null ? domain.eventType() : EventType.POINT)
                .endYear(domain.endYear())
                .endMonth(domain.endMonth())
                .endDay(domain.endDay())
                .build();
        entity.setCategories(new ArrayList<>(categoryEntities));
        entity.setCountries(new ArrayList<>(countryEntities));
        return entity;
    }
}

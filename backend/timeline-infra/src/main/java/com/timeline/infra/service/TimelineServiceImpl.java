package com.timeline.infra.service;

import com.timeline.core.domain.PrecisionLevel;
import com.timeline.core.domain.Timeline;
import com.timeline.core.service.TimelineService;
import com.timeline.infra.entity.CategoryEntity;
import com.timeline.infra.entity.CountryEntity;
import com.timeline.infra.entity.TimelineEntity;
import com.timeline.infra.repository.CategoryRepository;
import com.timeline.infra.repository.CountryRepository;
import com.timeline.infra.repository.TimelineRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TimelineServiceImpl implements TimelineService {

    private final TimelineRepository timelineRepository;
    private final CategoryRepository categoryRepository;
    private final CountryRepository countryRepository;

    @Override
    public List<Timeline> findAll() {
        return timelineRepository.findAllWithCategories()
                .stream()
                .map(TimelineEntity::toDomain)
                .distinct()
                .toList();
    }

    @Override
    public Optional<Timeline> findById(Long id) {
        return timelineRepository.findByIdWithCategories(id)
                .map(TimelineEntity::toDomain);
    }

    @Override
    @Transactional
    public Timeline create(Timeline timeline, List<Long> categoryIds, List<Long> countryIds) {
        List<CategoryEntity> categoryEntities = categoryIds.stream()
                .map(id -> categoryRepository.findById(id)
                        .orElseThrow(() -> new NoSuchElementException("Category not found: " + id)))
                .toList();
        List<CountryEntity> countryEntities = countryIds.stream()
                .map(id -> countryRepository.findById(id)
                        .orElseThrow(() -> new NoSuchElementException("Country not found: " + id)))
                .toList();
        TimelineEntity entity = TimelineEntity.fromDomain(timeline, categoryEntities, countryEntities);
        return timelineRepository.save(entity).toDomain();
    }

    @Override
    @Transactional
    public Timeline update(Long id, Timeline timeline, List<Long> categoryIds, List<Long> countryIds) {
        TimelineEntity entity = timelineRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Timeline not found: " + id));
        List<CategoryEntity> categoryEntities = categoryIds.stream()
                .map(cid -> categoryRepository.findById(cid)
                        .orElseThrow(() -> new NoSuchElementException("Category not found: " + cid)))
                .toList();
        List<CountryEntity> countryEntities = countryIds.stream()
                .map(cid -> countryRepository.findById(cid)
                        .orElseThrow(() -> new NoSuchElementException("Country not found: " + cid)))
                .toList();
        entity.setTitle(timeline.title());
        entity.setDescription(timeline.description());
        entity.setCategories(new java.util.ArrayList<>(categoryEntities));
        entity.setCountries(new java.util.ArrayList<>(countryEntities));
        entity.setEventYear(timeline.eventYear());
        entity.setPrecisionLevel(timeline.precisionLevel());
        entity.setEventMonth(timeline.eventMonth());
        entity.setEventDay(timeline.eventDay());
        entity.setSortOrder(timeline.sortOrder());
        entity.setEventLocalDateTime(timeline.eventLocalDateTime());
        entity.setEventUtcDateTime(timeline.eventUtcDateTime());
        entity.setTimeZone(timeline.timeZone());
        entity.setUncertaintyYears(timeline.uncertaintyYears());
        entity.setLocation(timeline.location());
        entity.setSource(timeline.source());
        return timelineRepository.save(entity).toDomain();
    }

    @Override
    public List<Timeline> search(Long fromYear, Long toYear, Long categoryId, PrecisionLevel minPrecisionLevel) {
        List<TimelineEntity> entities = timelineRepository.search(fromYear, toYear, categoryId);
        Stream<Timeline> stream = entities.stream().map(TimelineEntity::toDomain).distinct();
        if (minPrecisionLevel != null) {
            stream = stream.filter(t -> t.precisionLevel().getCode() >= minPrecisionLevel.getCode());
        }
        return stream.toList();
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!timelineRepository.existsById(id)) {
            throw new NoSuchElementException("Timeline not found: " + id);
        }
        timelineRepository.deleteById(id);
    }
}

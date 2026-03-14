package com.timeline.infra.service;

import com.timeline.core.domain.PrecisionLevel;
import com.timeline.core.domain.Timeline;
import com.timeline.core.service.TimelineService;
import com.timeline.infra.entity.CategoryEntity;
import com.timeline.infra.entity.TimelineEntity;
import com.timeline.infra.repository.CategoryRepository;
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

    @Override
    public List<Timeline> findAll() {
        return timelineRepository.findAll()
                .stream()
                .map(TimelineEntity::toDomain)
                .toList();
    }

    @Override
    public Optional<Timeline> findById(Long id) {
        return timelineRepository.findById(id)
                .map(TimelineEntity::toDomain);
    }

    @Override
    @Transactional
    public Timeline create(Timeline timeline, Long categoryId) {
        CategoryEntity categoryEntity = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new NoSuchElementException("Category not found: " + categoryId));
        TimelineEntity entity = TimelineEntity.fromDomain(timeline, categoryEntity);
        return timelineRepository.save(entity).toDomain();
    }

    @Override
    @Transactional
    public Timeline update(Long id, Timeline timeline, Long categoryId) {
        TimelineEntity entity = timelineRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Timeline not found: " + id));
        CategoryEntity categoryEntity = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new NoSuchElementException("Category not found: " + categoryId));
        entity.setTitle(timeline.title());
        entity.setDescription(timeline.description());
        entity.setCategory(categoryEntity);
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
        Stream<Timeline> stream = entities.stream().map(TimelineEntity::toDomain);
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

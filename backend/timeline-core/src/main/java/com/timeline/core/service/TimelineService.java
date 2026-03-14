package com.timeline.core.service;

import com.timeline.core.domain.PrecisionLevel;
import com.timeline.core.domain.Timeline;

import java.util.List;
import java.util.Optional;

public interface TimelineService {

    List<Timeline> findAll();

    Optional<Timeline> findById(Long id);

    Timeline create(Timeline timeline, Long categoryId);

    Timeline update(Long id, Timeline timeline, Long categoryId);

    void delete(Long id);

    List<Timeline> search(Long fromYear, Long toYear, Long categoryId, PrecisionLevel minPrecisionLevel);
}

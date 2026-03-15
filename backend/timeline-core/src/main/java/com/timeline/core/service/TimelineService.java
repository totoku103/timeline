package com.timeline.core.service;

import com.timeline.core.domain.PrecisionLevel;
import com.timeline.core.domain.Timeline;

import java.util.List;
import java.util.Optional;

public interface TimelineService {

    List<Timeline> findAll();

    Optional<Timeline> findById(Long id);

    Timeline create(Timeline timeline, List<Long> categoryIds, List<Long> countryIds);

    Timeline update(Long id, Timeline timeline, List<Long> categoryIds, List<Long> countryIds);

    void delete(Long id);

    List<Timeline> search(Long fromYear, Long toYear, List<Long> categoryIds, List<Long> countryIds, PrecisionLevel minPrecisionLevel);
}

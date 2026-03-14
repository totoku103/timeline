package com.timeline.infra.service;

import com.timeline.core.domain.Category;
import com.timeline.core.domain.PrecisionLevel;
import com.timeline.core.domain.Timeline;
import com.timeline.infra.entity.CategoryEntity;
import com.timeline.infra.entity.CountryEntity;
import com.timeline.infra.entity.TimelineEntity;
import com.timeline.infra.repository.CategoryRepository;
import com.timeline.infra.repository.CountryRepository;
import com.timeline.infra.repository.TimelineRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TimelineServiceImplTest {

    @Mock
    private TimelineRepository timelineRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private CountryRepository countryRepository;

    @InjectMocks
    private TimelineServiceImpl timelineService;

    private CategoryEntity categoryEntity;
    private TimelineEntity timelineEntity;
    private Timeline timelineDomain;

    @BeforeEach
    void setUp() {
        categoryEntity = CategoryEntity.builder()
                .name("History")
                .description("Historical events")
                .build();

        timelineEntity = TimelineEntity.builder()
                .title("Test Event")
                .description("A test event")
                .categories(new ArrayList<>(List.of(categoryEntity)))
                .eventYear(2000L)
                .precisionLevel(PrecisionLevel.YEAR)
                .build();

        timelineDomain = new Timeline(
                null,
                "Test Event",
                "A test event",
                List.of(new Category(null, "History", "Historical events", null, null, null, null)),
                null,
                2000L,
                PrecisionLevel.YEAR,
                null, null, 0,
                null, null, null, null, null, null,
                null, null, null, null,
                null, null, null, null
        );
    }

    @Test
    void findAll_정상_동작() {
        when(timelineRepository.findAllWithCategories()).thenReturn(List.of(timelineEntity));

        List<Timeline> result = timelineService.findAll();

        assertEquals(1, result.size());
        assertEquals("Test Event", result.get(0).title());
        verify(timelineRepository).findAllWithCategories();
    }

    @Test
    void findAll_빈_목록_반환() {
        when(timelineRepository.findAllWithCategories()).thenReturn(List.of());

        List<Timeline> result = timelineService.findAll();

        assertTrue(result.isEmpty());
        verify(timelineRepository).findAllWithCategories();
    }

    @Test
    void findById_존재하는_경우_반환() {
        when(timelineRepository.findByIdWithCategories(1L)).thenReturn(Optional.of(timelineEntity));

        Optional<Timeline> result = timelineService.findById(1L);

        assertTrue(result.isPresent());
        assertEquals("Test Event", result.get().title());
        verify(timelineRepository).findByIdWithCategories(1L);
    }

    @Test
    void findById_존재하지_않는_경우_빈_Optional_반환() {
        when(timelineRepository.findByIdWithCategories(99L)).thenReturn(Optional.empty());

        Optional<Timeline> result = timelineService.findById(99L);

        assertTrue(result.isEmpty());
        verify(timelineRepository).findByIdWithCategories(99L);
    }

    @Test
    void create_정상_동작() {
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(categoryEntity));
        when(timelineRepository.save(any(TimelineEntity.class))).thenReturn(timelineEntity);

        Timeline result = timelineService.create(timelineDomain, List.of(1L), List.of());

        assertNotNull(result);
        assertEquals("Test Event", result.title());
        verify(categoryRepository).findById(1L);
        verify(timelineRepository).save(any(TimelineEntity.class));
    }

    @Test
    void create_카테고리_없으면_NoSuchElementException() {
        when(categoryRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(NoSuchElementException.class, () ->
                timelineService.create(timelineDomain, List.of(99L), List.of())
        );
        verify(categoryRepository).findById(99L);
        verify(timelineRepository, never()).save(any());
    }

    @Test
    void update_정상_동작() {
        when(timelineRepository.findById(1L)).thenReturn(Optional.of(timelineEntity));
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(categoryEntity));
        when(timelineRepository.save(any(TimelineEntity.class))).thenReturn(timelineEntity);

        Timeline result = timelineService.update(1L, timelineDomain, List.of(1L), List.of());

        assertNotNull(result);
        assertEquals("Test Event", result.title());
        verify(timelineRepository).findById(1L);
        verify(categoryRepository).findById(1L);
        verify(timelineRepository).save(any(TimelineEntity.class));
    }

    @Test
    void update_타임라인_없으면_NoSuchElementException() {
        when(timelineRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(NoSuchElementException.class, () ->
                timelineService.update(99L, timelineDomain, List.of(1L), List.of())
        );
        verify(timelineRepository).findById(99L);
        verify(categoryRepository, never()).findById(anyLong());
        verify(timelineRepository, never()).save(any());
    }

    @Test
    void update_카테고리_없으면_NoSuchElementException() {
        when(timelineRepository.findById(1L)).thenReturn(Optional.of(timelineEntity));
        when(categoryRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(NoSuchElementException.class, () ->
                timelineService.update(1L, timelineDomain, List.of(99L), List.of())
        );
        verify(timelineRepository).findById(1L);
        verify(categoryRepository).findById(99L);
        verify(timelineRepository, never()).save(any());
    }

    @Test
    void delete_정상_동작() {
        when(timelineRepository.existsById(1L)).thenReturn(true);
        doNothing().when(timelineRepository).deleteById(1L);

        assertDoesNotThrow(() -> timelineService.delete(1L));

        verify(timelineRepository).existsById(1L);
        verify(timelineRepository).deleteById(1L);
    }

    @Test
    void delete_존재하지_않으면_NoSuchElementException() {
        when(timelineRepository.existsById(99L)).thenReturn(false);

        assertThrows(NoSuchElementException.class, () ->
                timelineService.delete(99L)
        );
        verify(timelineRepository).existsById(99L);
        verify(timelineRepository, never()).deleteById(anyLong());
    }

    @Test
    void search_파라미터_모두_null_전체_조회() {
        when(timelineRepository.search(null, null, null)).thenReturn(List.of(timelineEntity));

        List<Timeline> result = timelineService.search(null, null, null, null);

        assertEquals(1, result.size());
        assertEquals("Test Event", result.get(0).title());
        verify(timelineRepository).search(null, null, null);
    }

    @Test
    void search_fromYear_toYear_범위_조회() {
        TimelineEntity entity1 = TimelineEntity.builder()
                .title("Event 1990")
                .description("1990 event")
                .categories(new ArrayList<>(List.of(categoryEntity)))
                .eventYear(1990L)
                .precisionLevel(PrecisionLevel.YEAR)
                .build();
        TimelineEntity entity2 = TimelineEntity.builder()
                .title("Event 2000")
                .description("2000 event")
                .categories(new ArrayList<>(List.of(categoryEntity)))
                .eventYear(2000L)
                .precisionLevel(PrecisionLevel.YEAR)
                .build();

        when(timelineRepository.search(1990L, 2000L, null)).thenReturn(List.of(entity1, entity2));

        List<Timeline> result = timelineService.search(1990L, 2000L, null, null);

        assertEquals(2, result.size());
        assertEquals("Event 1990", result.get(0).title());
        assertEquals("Event 2000", result.get(1).title());
        verify(timelineRepository).search(1990L, 2000L, null);
    }

    @Test
    void search_categoryId_필터() {
        when(timelineRepository.search(null, null, 1L)).thenReturn(List.of(timelineEntity));

        List<Timeline> result = timelineService.search(null, null, 1L, null);

        assertEquals(1, result.size());
        verify(timelineRepository).search(null, null, 1L);
    }

    @Test
    void search_precisionLevel_필터() {
        TimelineEntity yearEntity = TimelineEntity.builder()
                .title("Year Event")
                .description("year precision")
                .categories(new ArrayList<>(List.of(categoryEntity)))
                .eventYear(2000L)
                .precisionLevel(PrecisionLevel.YEAR)
                .build();
        TimelineEntity monthEntity = TimelineEntity.builder()
                .title("Month Event")
                .description("month precision")
                .categories(new ArrayList<>(List.of(categoryEntity)))
                .eventYear(2000L)
                .precisionLevel(PrecisionLevel.MONTH)
                .build();
        TimelineEntity centuryEntity = TimelineEntity.builder()
                .title("Century Event")
                .description("century precision")
                .categories(new ArrayList<>(List.of(categoryEntity)))
                .eventYear(2000L)
                .precisionLevel(PrecisionLevel.CENTURY)
                .build();

        when(timelineRepository.search(null, null, null))
                .thenReturn(List.of(centuryEntity, yearEntity, monthEntity));

        // YEAR(code=9) 이상만 → YEAR(9), MONTH(10) 포함, CENTURY(7) 제외
        List<Timeline> result = timelineService.search(null, null, null, PrecisionLevel.YEAR);

        assertEquals(2, result.size());
        assertTrue(result.stream().anyMatch(t -> t.title().equals("Year Event")));
        assertTrue(result.stream().anyMatch(t -> t.title().equals("Month Event")));
        assertFalse(result.stream().anyMatch(t -> t.title().equals("Century Event")));
        verify(timelineRepository).search(null, null, null);
    }

    @Test
    void search_복합_조건() {
        TimelineEntity entity = TimelineEntity.builder()
                .title("Filtered Event")
                .description("filtered")
                .categories(new ArrayList<>(List.of(categoryEntity)))
                .eventYear(2000L)
                .precisionLevel(PrecisionLevel.MONTH)
                .build();

        when(timelineRepository.search(1990L, 2026L, 1L)).thenReturn(List.of(entity));

        List<Timeline> result = timelineService.search(1990L, 2026L, 1L, PrecisionLevel.YEAR);

        assertEquals(1, result.size());
        assertEquals("Filtered Event", result.get(0).title());
        verify(timelineRepository).search(1990L, 2026L, 1L);
    }
}

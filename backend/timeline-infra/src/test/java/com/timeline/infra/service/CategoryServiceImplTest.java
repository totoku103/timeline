package com.timeline.infra.service;

import com.timeline.core.domain.Category;
import com.timeline.infra.entity.CategoryEntity;
import com.timeline.infra.repository.CategoryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CategoryServiceImplTest {

    @Mock
    private CategoryRepository categoryRepository;

    @InjectMocks
    private CategoryServiceImpl categoryService;

    private CategoryEntity categoryEntity;
    private Category categoryDomain;

    @BeforeEach
    void setUp() {
        categoryEntity = CategoryEntity.builder()
                .name("History")
                .description("Historical events")
                .build();

        categoryDomain = new Category(null, "History", "Historical events", null, null, null, null);
    }

    @Test
    void findAll_정상_동작() {
        when(categoryRepository.findAll()).thenReturn(List.of(categoryEntity));

        List<Category> result = categoryService.findAll();

        assertEquals(1, result.size());
        assertEquals("History", result.get(0).name());
        verify(categoryRepository).findAll();
    }

    @Test
    void findAll_빈_목록_반환() {
        when(categoryRepository.findAll()).thenReturn(List.of());

        List<Category> result = categoryService.findAll();

        assertTrue(result.isEmpty());
        verify(categoryRepository).findAll();
    }

    @Test
    void findById_존재하는_경우_반환() {
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(categoryEntity));

        Optional<Category> result = categoryService.findById(1L);

        assertTrue(result.isPresent());
        assertEquals("History", result.get().name());
        verify(categoryRepository).findById(1L);
    }

    @Test
    void findById_존재하지_않는_경우_빈_Optional_반환() {
        when(categoryRepository.findById(99L)).thenReturn(Optional.empty());

        Optional<Category> result = categoryService.findById(99L);

        assertTrue(result.isEmpty());
        verify(categoryRepository).findById(99L);
    }

    @Test
    void create_정상_동작() {
        when(categoryRepository.save(any(CategoryEntity.class))).thenReturn(categoryEntity);

        Category result = categoryService.create(categoryDomain);

        assertNotNull(result);
        assertEquals("History", result.name());
        verify(categoryRepository).save(any(CategoryEntity.class));
    }

    @Test
    void update_정상_동작() {
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(categoryEntity));
        when(categoryRepository.save(any(CategoryEntity.class))).thenReturn(categoryEntity);

        Category result = categoryService.update(1L, categoryDomain);

        assertNotNull(result);
        assertEquals("History", result.name());
        verify(categoryRepository).findById(1L);
        verify(categoryRepository).save(any(CategoryEntity.class));
    }

    @Test
    void update_존재하지_않으면_NoSuchElementException() {
        when(categoryRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(NoSuchElementException.class, () ->
                categoryService.update(99L, categoryDomain)
        );
        verify(categoryRepository).findById(99L);
        verify(categoryRepository, never()).save(any());
    }

    @Test
    void delete_정상_동작() {
        when(categoryRepository.existsById(1L)).thenReturn(true);
        doNothing().when(categoryRepository).deleteById(1L);

        assertDoesNotThrow(() -> categoryService.delete(1L));

        verify(categoryRepository).existsById(1L);
        verify(categoryRepository).deleteById(1L);
    }

    @Test
    void delete_존재하지_않으면_NoSuchElementException() {
        when(categoryRepository.existsById(99L)).thenReturn(false);

        assertThrows(NoSuchElementException.class, () ->
                categoryService.delete(99L)
        );
        verify(categoryRepository).existsById(99L);
        verify(categoryRepository, never()).deleteById(anyLong());
    }
}

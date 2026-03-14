package com.timeline.infra.service;

import com.timeline.core.domain.Category;
import com.timeline.core.service.CategoryService;
import com.timeline.infra.entity.CategoryEntity;
import com.timeline.infra.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;

    @Override
    public List<Category> findAll() {
        return categoryRepository.findAll()
                .stream()
                .map(CategoryEntity::toDomain)
                .toList();
    }

    @Override
    public Optional<Category> findById(Long id) {
        return categoryRepository.findById(id)
                .map(CategoryEntity::toDomain);
    }

    @Override
    @Transactional
    public Category create(Category category) {
        CategoryEntity entity = CategoryEntity.fromDomain(category);
        return categoryRepository.save(entity).toDomain();
    }

    @Override
    @Transactional
    public Category update(Long id, Category category) {
        CategoryEntity entity = categoryRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Category not found: " + id));
        entity.setName(category.name());
        entity.setDescription(category.description());
        return categoryRepository.save(entity).toDomain();
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!categoryRepository.existsById(id)) {
            throw new NoSuchElementException("Category not found: " + id);
        }
        categoryRepository.deleteById(id);
    }
}

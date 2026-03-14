package com.timeline.infra.entity;

import com.timeline.core.domain.Category;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "categories")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class CategoryEntity extends BaseEntity {

    @Column(nullable = false, unique = true)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    public Category toDomain() {
        return new Category(getId(), name, description, getCreatedAt(), getUpdatedAt(), getCreatedBy(), getUpdatedBy());
    }

    public static CategoryEntity fromDomain(Category domain) {
        return CategoryEntity.builder()
                .name(domain.name())
                .description(domain.description())
                .build();
    }
}

package com.timeline.infra.entity;

import com.timeline.core.domain.Country;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "countries")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CountryEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(nullable = false, unique = true)
    private String code;

    public Country toDomain() {
        return new Country(id, name, code);
    }

    public static CountryEntity fromDomain(Country domain) {
        return CountryEntity.builder()
                .name(domain.name())
                .code(domain.code())
                .build();
    }
}

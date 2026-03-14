package com.timeline.core.service;

import com.timeline.core.domain.Country;

import java.util.List;
import java.util.Optional;

public interface CountryService {

    List<Country> findAll();

    Optional<Country> findById(Long id);

    Country create(Country country);

    Country update(Long id, Country country);

    void delete(Long id);
}

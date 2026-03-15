package com.timeline.infra.service;

import com.timeline.core.domain.Country;
import com.timeline.core.service.CountryService;
import com.timeline.infra.config.CacheConfig;
import com.timeline.infra.entity.CountryEntity;
import com.timeline.infra.repository.CountryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CountryServiceImpl implements CountryService {

    private final CountryRepository countryRepository;

    @Override
    @Cacheable(CacheConfig.COUNTRIES)
    public List<Country> findAll() {
        return countryRepository.findAll()
                .stream()
                .map(CountryEntity::toDomain)
                .toList();
    }

    @Override
    @Cacheable(value = CacheConfig.COUNTRY, key = "#id")
    public Optional<Country> findById(Long id) {
        return countryRepository.findById(id)
                .map(CountryEntity::toDomain);
    }

    @Override
    @Transactional
    @CacheEvict(value = CacheConfig.COUNTRIES, allEntries = true)
    public Country create(Country country) {
        CountryEntity entity = CountryEntity.fromDomain(country);
        return countryRepository.save(entity).toDomain();
    }

    @Override
    @Transactional
    @Caching(evict = {
            @CacheEvict(value = CacheConfig.COUNTRIES, allEntries = true),
            @CacheEvict(value = CacheConfig.COUNTRY, key = "#id")
    })
    public Country update(Long id, Country country) {
        CountryEntity entity = countryRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Country not found: " + id));
        entity.setName(country.name());
        entity.setCode(country.code());
        return countryRepository.save(entity).toDomain();
    }

    @Override
    @Transactional
    @Caching(evict = {
            @CacheEvict(value = CacheConfig.COUNTRIES, allEntries = true),
            @CacheEvict(value = CacheConfig.COUNTRY, key = "#id")
    })
    public void delete(Long id) {
        if (!countryRepository.existsById(id)) {
            throw new NoSuchElementException("Country not found: " + id);
        }
        countryRepository.deleteById(id);
    }
}

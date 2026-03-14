package com.timeline.api.controller;

import com.timeline.api.dto.CountryRequest;
import com.timeline.api.dto.CountryResponse;
import com.timeline.core.domain.Country;
import com.timeline.core.service.CountryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/countries")
@RequiredArgsConstructor
public class CountryController {

    private final CountryService countryService;

    @GetMapping
    public ResponseEntity<List<CountryResponse>> findAll() {
        List<CountryResponse> responses = countryService.findAll()
                .stream()
                .map(CountryResponse::from)
                .toList();
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/{id}")
    public ResponseEntity<CountryResponse> findById(@PathVariable Long id) {
        return countryService.findById(id)
                .map(CountryResponse::from)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<CountryResponse> create(@Valid @RequestBody CountryRequest request) {
        Country domain = new Country(null, request.name(), request.code());
        CountryResponse response = CountryResponse.from(countryService.create(domain));
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<CountryResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody CountryRequest request) {
        Country domain = new Country(id, request.name(), request.code());
        CountryResponse response = CountryResponse.from(countryService.update(id, domain));
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        countryService.delete(id);
        return ResponseEntity.noContent().build();
    }
}

package com.timeline.api.dto;

import com.timeline.core.domain.Country;

public record CountryResponse(
        Long id,
        String name,
        String code
) {
    public static CountryResponse from(Country domain) {
        return new CountryResponse(
                domain.id(),
                domain.name(),
                domain.code()
        );
    }
}

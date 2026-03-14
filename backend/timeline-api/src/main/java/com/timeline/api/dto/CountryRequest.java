package com.timeline.api.dto;

import jakarta.validation.constraints.NotBlank;

public record CountryRequest(
        @NotBlank String name,
        @NotBlank String code
) {
}

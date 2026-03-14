package com.timeline.core.domain;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import static org.junit.jupiter.api.Assertions.*;

class PrecisionLevelTest {

    @ParameterizedTest(name = "fromCode({0}) == {1}")
    @CsvSource({
            "0,  BILLION_YEARS",
            "1,  HUNDRED_MILLION_YEARS",
            "2,  TEN_MILLION_YEARS",
            "3,  MILLION_YEARS",
            "4,  HUNDRED_THOUSAND_YEARS",
            "5,  TEN_THOUSAND_YEARS",
            "6,  MILLENNIUM",
            "7,  CENTURY",
            "8,  DECADE",
            "9,  YEAR",
            "10, MONTH",
            "11, DAY",
            "12, HOUR",
            "13, MINUTE",
            "14, SECOND"
    })
    void fromCode_정상_매핑(int code, String expectedName) {
        PrecisionLevel level = PrecisionLevel.fromCode(code);
        assertEquals(PrecisionLevel.valueOf(expectedName), level);
    }

    @Test
    void fromCode_잘못된_코드_IllegalArgumentException() {
        assertThrows(IllegalArgumentException.class, () -> PrecisionLevel.fromCode(-1));
        assertThrows(IllegalArgumentException.class, () -> PrecisionLevel.fromCode(15));
        assertThrows(IllegalArgumentException.class, () -> PrecisionLevel.fromCode(999));
    }

    @ParameterizedTest(name = "requiresDateTime({0}) == {1}")
    @CsvSource({
            "BILLION_YEARS,          false",
            "HUNDRED_MILLION_YEARS,  false",
            "TEN_MILLION_YEARS,      false",
            "MILLION_YEARS,          false",
            "HUNDRED_THOUSAND_YEARS, false",
            "TEN_THOUSAND_YEARS,     false",
            "MILLENNIUM,             false",
            "CENTURY,                false",
            "DECADE,                 false",
            "YEAR,                   false",
            "MONTH,                  false",
            "DAY,                    true",
            "HOUR,                   true",
            "MINUTE,                 true",
            "SECOND,                 true"
    })
    void requiresDateTime_코드11이상이면_true(String levelName, boolean expected) {
        PrecisionLevel level = PrecisionLevel.valueOf(levelName.trim());
        assertEquals(expected, level.requiresDateTime());
    }

    @Test
    void getCode_값_확인() {
        assertEquals(0, PrecisionLevel.BILLION_YEARS.getCode());
        assertEquals(9, PrecisionLevel.YEAR.getCode());
        assertEquals(11, PrecisionLevel.DAY.getCode());
        assertEquals(14, PrecisionLevel.SECOND.getCode());
    }

    @Test
    void getDescription_값_확인() {
        assertEquals("연도", PrecisionLevel.YEAR.getDescription());
        assertEquals("일", PrecisionLevel.DAY.getDescription());
    }
}

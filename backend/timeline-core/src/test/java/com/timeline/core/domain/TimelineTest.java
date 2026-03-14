package com.timeline.core.domain;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class TimelineTest {

    private Timeline validTimeline() {
        return new Timeline(
                1L,
                "Test Title",
                "Test description",
                new Category(1L, "History", null, null, null, null, null),
                2000L,
                PrecisionLevel.YEAR,
                null, null, 0,
                null, null, null, null, null, null,
                null, null, null, null,
                null, null, null, null
        );
    }

    @Test
    void 정상_생성() {
        Timeline timeline = validTimeline();
        assertEquals("Test Title", timeline.title());
        assertEquals(PrecisionLevel.YEAR, timeline.precisionLevel());
    }

    @Test
    void title이_null이면_IllegalArgumentException() {
        assertThrows(IllegalArgumentException.class, () ->
                new Timeline(
                        null, null, null,
                        new Category(1L, "History", null, null, null, null, null),
                        2000L, PrecisionLevel.YEAR,
                        null, null, 0,
                        null, null, null, null, null, null,
                        null, null, null, null,
                        null, null, null, null
                )
        );
    }

    @Test
    void title이_blank이면_IllegalArgumentException() {
        assertThrows(IllegalArgumentException.class, () ->
                new Timeline(
                        null, "   ", null,
                        new Category(1L, "History", null, null, null, null, null),
                        2000L, PrecisionLevel.YEAR,
                        null, null, 0,
                        null, null, null, null, null, null,
                        null, null, null, null,
                        null, null, null, null
                )
        );
    }

    @Test
    void title이_빈문자열이면_IllegalArgumentException() {
        assertThrows(IllegalArgumentException.class, () ->
                new Timeline(
                        null, "", null,
                        new Category(1L, "History", null, null, null, null, null),
                        2000L, PrecisionLevel.YEAR,
                        null, null, 0,
                        null, null, null, null, null, null,
                        null, null, null, null,
                        null, null, null, null
                )
        );
    }

    @Test
    void precisionLevel이_null이면_IllegalArgumentException() {
        assertThrows(IllegalArgumentException.class, () ->
                new Timeline(
                        null, "Valid Title", null,
                        new Category(1L, "History", null, null, null, null, null),
                        2000L, null,
                        null, null, 0,
                        null, null, null, null, null, null,
                        null, null, null, null,
                        null, null, null, null
                )
        );
    }
}

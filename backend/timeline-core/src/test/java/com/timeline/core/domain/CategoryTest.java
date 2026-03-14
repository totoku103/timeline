package com.timeline.core.domain;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class CategoryTest {

    @Test
    void 정상_생성() {
        Category category = new Category(1L, "History", "Historical events", null, null, null, null);
        assertEquals(1L, category.id());
        assertEquals("History", category.name());
        assertEquals("Historical events", category.description());
    }

    @Test
    void description이_null이어도_정상_생성() {
        Category category = new Category(1L, "History", null, null, null, null, null);
        assertEquals("History", category.name());
        assertNull(category.description());
    }

    @Test
    void name이_null이면_IllegalArgumentException() {
        assertThrows(IllegalArgumentException.class, () ->
                new Category(1L, null, "desc", null, null, null, null)
        );
    }

    @Test
    void name이_blank이면_IllegalArgumentException() {
        assertThrows(IllegalArgumentException.class, () ->
                new Category(1L, "   ", "desc", null, null, null, null)
        );
    }

    @Test
    void name이_빈문자열이면_IllegalArgumentException() {
        assertThrows(IllegalArgumentException.class, () ->
                new Category(1L, "", "desc", null, null, null, null)
        );
    }
}

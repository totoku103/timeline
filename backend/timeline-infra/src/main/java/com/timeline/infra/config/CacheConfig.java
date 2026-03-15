package com.timeline.infra.config;

import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableCaching
public class CacheConfig {

    public static final String CATEGORIES = "categories";
    public static final String CATEGORY = "category";
    public static final String TIMELINES = "timelines";
    public static final String TIMELINE = "timeline";
    public static final String TIMELINE_SEARCH = "timelineSearch";
    public static final String COUNTRIES = "countries";
    public static final String COUNTRY = "country";

    @Bean
    public CacheManager cacheManager() {
        return new ConcurrentMapCacheManager(
                CATEGORIES, CATEGORY,
                TIMELINES, TIMELINE, TIMELINE_SEARCH,
                COUNTRIES, COUNTRY
        );
    }
}

package com.timeline.infra.repository;

import com.timeline.infra.entity.TimelineEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TimelineRepository extends JpaRepository<TimelineEntity, Long> {

    @Query("SELECT t FROM TimelineEntity t LEFT JOIN FETCH t.categories")
    List<TimelineEntity> findAllWithCategories();

    @Query("SELECT t FROM TimelineEntity t LEFT JOIN FETCH t.categories WHERE t.id = :id")
    Optional<TimelineEntity> findByIdWithCategories(@Param("id") Long id);

    @Query("SELECT t FROM TimelineEntity t LEFT JOIN FETCH t.categories " +
           "WHERE (:fromYear IS NULL OR t.eventYear >= :fromYear) " +
           "AND (:toYear IS NULL OR t.eventYear <= :toYear) " +
           "AND (:categoryId IS NULL OR EXISTS (SELECT c FROM t.categories c WHERE c.id = :categoryId)) " +
           "ORDER BY t.eventYear ASC, " +
           "CASE WHEN t.eventMonth IS NULL THEN 1 ELSE 0 END ASC, t.eventMonth ASC, " +
           "CASE WHEN t.eventDay IS NULL THEN 1 ELSE 0 END ASC, t.eventDay ASC, " +
           "t.sortOrder ASC")
    List<TimelineEntity> search(@Param("fromYear") Long fromYear,
                                @Param("toYear") Long toYear,
                                @Param("categoryId") Long categoryId);
}

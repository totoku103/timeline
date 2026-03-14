package com.timeline.api.controller;

import tools.jackson.databind.ObjectMapper;
import com.timeline.api.dto.TimelineRequest;
import com.timeline.core.domain.Category;
import com.timeline.core.domain.EventType;
import com.timeline.core.domain.PrecisionLevel;
import com.timeline.core.domain.Timeline;
import com.timeline.core.service.TimelineService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.restdocs.RestDocumentationContextProvider;
import org.springframework.restdocs.RestDocumentationExtension;
import org.springframework.restdocs.mockmvc.MockMvcRestDocumentation;
import org.springframework.restdocs.mockmvc.RestDocumentationRequestBuilders;
import org.springframework.restdocs.payload.JsonFieldType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.doNothing;
import static org.springframework.restdocs.mockmvc.MockMvcRestDocumentation.document;
import static org.springframework.restdocs.operation.preprocess.Preprocessors.*;
import static org.springframework.restdocs.payload.PayloadDocumentation.*;
import static org.springframework.restdocs.request.RequestDocumentation.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(TimelineController.class)
@ExtendWith(RestDocumentationExtension.class)
class TimelineControllerDocsTest {

    private MockMvc mockMvc;

    @Autowired
    private WebApplicationContext context;

    @MockitoBean
    private TimelineService timelineService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private Category sampleCategory;
    private Timeline sampleTimeline;

    @BeforeEach
    void setUp(RestDocumentationContextProvider restDocumentation) {
        this.mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .apply(MockMvcRestDocumentation.documentationConfiguration(restDocumentation))
                .build();

        sampleCategory = new Category(
                1L, "역사", "역사 카테고리",
                LocalDateTime.of(2024, 1, 1, 0, 0),
                LocalDateTime.of(2024, 1, 1, 0, 0),
                "admin", "admin"
        );

        sampleTimeline = new Timeline(
                1L,
                "제2차 세계대전 종전",
                "1945년 제2차 세계대전이 종전되었습니다.",
                List.of(sampleCategory),
                1945L,
                PrecisionLevel.YEAR,
                8,
                15,
                0,
                null,
                null,
                null,
                null,
                "유럽/태평양",
                "위키피디아",
                LocalDateTime.of(2024, 1, 1, 0, 0),
                LocalDateTime.of(2024, 1, 1, 0, 0),
                "admin",
                "admin",
                EventType.POINT,
                null,
                null,
                null
        );
    }

    @Test
    void findAll() throws Exception {
        given(timelineService.findAll()).willReturn(List.of(sampleTimeline));

        mockMvc.perform(RestDocumentationRequestBuilders.get("/api/timelines")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andDo(document("timeline-find-all",
                        preprocessRequest(prettyPrint()),
                        preprocessResponse(prettyPrint()),
                        responseFields(
                                fieldWithPath("[].id").type(JsonFieldType.NUMBER).description("타임라인 ID"),
                                fieldWithPath("[].title").type(JsonFieldType.STRING).description("제목"),
                                fieldWithPath("[].description").type(JsonFieldType.STRING).optional().description("설명"),
                                fieldWithPath("[].categoryIds").type(JsonFieldType.ARRAY).description("카테고리 ID 목록"),
                                fieldWithPath("[].categoryNames").type(JsonFieldType.ARRAY).description("카테고리명 목록"),
                                fieldWithPath("[].eventYear").type(JsonFieldType.NUMBER).description("사건 연도"),
                                fieldWithPath("[].precisionLevel").type(JsonFieldType.STRING).description("정밀도 레벨 (BILLION_YEARS ~ SECOND)"),
                                fieldWithPath("[].eventMonth").type(JsonFieldType.NUMBER).optional().description("사건 월"),
                                fieldWithPath("[].eventDay").type(JsonFieldType.NUMBER).optional().description("사건 일"),
                                fieldWithPath("[].sortOrder").type(JsonFieldType.NUMBER).description("정렬 순서"),
                                fieldWithPath("[].eventLocalDateTime").type(JsonFieldType.STRING).optional().description("사건 로컬 일시"),
                                fieldWithPath("[].eventUtcDateTime").type(JsonFieldType.STRING).optional().description("사건 UTC 일시"),
                                fieldWithPath("[].timeZone").type(JsonFieldType.STRING).optional().description("타임존"),
                                fieldWithPath("[].uncertaintyYears").type(JsonFieldType.NUMBER).optional().description("불확실도 (년)"),
                                fieldWithPath("[].location").type(JsonFieldType.STRING).optional().description("위치"),
                                fieldWithPath("[].source").type(JsonFieldType.STRING).optional().description("출처"),
                                fieldWithPath("[].createdAt").type(JsonFieldType.STRING).optional().description("생성일시"),
                                fieldWithPath("[].updatedAt").type(JsonFieldType.STRING).optional().description("수정일시"),
                                fieldWithPath("[].createdBy").type(JsonFieldType.STRING).optional().description("생성자"),
                                fieldWithPath("[].updatedBy").type(JsonFieldType.STRING).optional().description("수정자"),
                                fieldWithPath("[].eventType").type(JsonFieldType.STRING).optional().description("이벤트 유형 (POINT/RANGE)"),
                                fieldWithPath("[].endYear").type(JsonFieldType.NUMBER).optional().description("종료 연도 (RANGE일 때)"),
                                fieldWithPath("[].endMonth").type(JsonFieldType.NUMBER).optional().description("종료 월 (RANGE일 때)"),
                                fieldWithPath("[].endDay").type(JsonFieldType.NUMBER).optional().description("종료 일 (RANGE일 때)")
                        )
                ));
    }

    @Test
    void search() throws Exception {
        given(timelineService.search(any(), any(), any(), any())).willReturn(List.of(sampleTimeline));

        mockMvc.perform(RestDocumentationRequestBuilders.get("/api/timelines/search")
                        .param("fromYear", "1900")
                        .param("toYear", "2000")
                        .param("categoryId", "1")
                        .param("precisionLevel", "YEAR")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andDo(document("timeline-search",
                        preprocessRequest(prettyPrint()),
                        preprocessResponse(prettyPrint()),
                        queryParameters(
                                parameterWithName("fromYear").optional().description("조회 시작 연도"),
                                parameterWithName("toYear").optional().description("조회 종료 연도"),
                                parameterWithName("categoryId").optional().description("카테고리 ID"),
                                parameterWithName("precisionLevel").optional().description("최소 정밀도 레벨 (BILLION_YEARS ~ SECOND)")
                        ),
                        responseFields(
                                fieldWithPath("[].id").type(JsonFieldType.NUMBER).description("타임라인 ID"),
                                fieldWithPath("[].title").type(JsonFieldType.STRING).description("제목"),
                                fieldWithPath("[].description").type(JsonFieldType.STRING).optional().description("설명"),
                                fieldWithPath("[].categoryIds").type(JsonFieldType.ARRAY).description("카테고리 ID 목록"),
                                fieldWithPath("[].categoryNames").type(JsonFieldType.ARRAY).description("카테고리명 목록"),
                                fieldWithPath("[].eventYear").type(JsonFieldType.NUMBER).description("사건 연도"),
                                fieldWithPath("[].precisionLevel").type(JsonFieldType.STRING).description("정밀도 레벨"),
                                fieldWithPath("[].eventMonth").type(JsonFieldType.NUMBER).optional().description("사건 월"),
                                fieldWithPath("[].eventDay").type(JsonFieldType.NUMBER).optional().description("사건 일"),
                                fieldWithPath("[].sortOrder").type(JsonFieldType.NUMBER).description("정렬 순서"),
                                fieldWithPath("[].eventLocalDateTime").type(JsonFieldType.STRING).optional().description("사건 로컬 일시"),
                                fieldWithPath("[].eventUtcDateTime").type(JsonFieldType.STRING).optional().description("사건 UTC 일시"),
                                fieldWithPath("[].timeZone").type(JsonFieldType.STRING).optional().description("타임존"),
                                fieldWithPath("[].uncertaintyYears").type(JsonFieldType.NUMBER).optional().description("불확실도 (년)"),
                                fieldWithPath("[].location").type(JsonFieldType.STRING).optional().description("위치"),
                                fieldWithPath("[].source").type(JsonFieldType.STRING).optional().description("출처"),
                                fieldWithPath("[].createdAt").type(JsonFieldType.STRING).optional().description("생성일시"),
                                fieldWithPath("[].updatedAt").type(JsonFieldType.STRING).optional().description("수정일시"),
                                fieldWithPath("[].createdBy").type(JsonFieldType.STRING).optional().description("생성자"),
                                fieldWithPath("[].updatedBy").type(JsonFieldType.STRING).optional().description("수정자"),
                                fieldWithPath("[].eventType").type(JsonFieldType.STRING).optional().description("이벤트 유형 (POINT/RANGE)"),
                                fieldWithPath("[].endYear").type(JsonFieldType.NUMBER).optional().description("종료 연도 (RANGE일 때)"),
                                fieldWithPath("[].endMonth").type(JsonFieldType.NUMBER).optional().description("종료 월 (RANGE일 때)"),
                                fieldWithPath("[].endDay").type(JsonFieldType.NUMBER).optional().description("종료 일 (RANGE일 때)")
                        )
                ));
    }

    @Test
    void findById() throws Exception {
        given(timelineService.findById(1L)).willReturn(Optional.of(sampleTimeline));

        mockMvc.perform(RestDocumentationRequestBuilders.get("/api/timelines/{id}", 1L)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andDo(document("timeline-find-by-id",
                        preprocessRequest(prettyPrint()),
                        preprocessResponse(prettyPrint()),
                        pathParameters(
                                parameterWithName("id").description("타임라인 ID")
                        ),
                        responseFields(
                                fieldWithPath("id").type(JsonFieldType.NUMBER).description("타임라인 ID"),
                                fieldWithPath("title").type(JsonFieldType.STRING).description("제목"),
                                fieldWithPath("description").type(JsonFieldType.STRING).optional().description("설명"),
                                fieldWithPath("categoryIds").type(JsonFieldType.ARRAY).description("카테고리 ID 목록"),
                                fieldWithPath("categoryNames").type(JsonFieldType.ARRAY).description("카테고리명 목록"),
                                fieldWithPath("eventYear").type(JsonFieldType.NUMBER).description("사건 연도"),
                                fieldWithPath("precisionLevel").type(JsonFieldType.STRING).description("정밀도 레벨"),
                                fieldWithPath("eventMonth").type(JsonFieldType.NUMBER).optional().description("사건 월"),
                                fieldWithPath("eventDay").type(JsonFieldType.NUMBER).optional().description("사건 일"),
                                fieldWithPath("sortOrder").type(JsonFieldType.NUMBER).description("정렬 순서"),
                                fieldWithPath("eventLocalDateTime").type(JsonFieldType.STRING).optional().description("사건 로컬 일시"),
                                fieldWithPath("eventUtcDateTime").type(JsonFieldType.STRING).optional().description("사건 UTC 일시"),
                                fieldWithPath("timeZone").type(JsonFieldType.STRING).optional().description("타임존"),
                                fieldWithPath("uncertaintyYears").type(JsonFieldType.NUMBER).optional().description("불확실도 (년)"),
                                fieldWithPath("location").type(JsonFieldType.STRING).optional().description("위치"),
                                fieldWithPath("source").type(JsonFieldType.STRING).optional().description("출처"),
                                fieldWithPath("createdAt").type(JsonFieldType.STRING).optional().description("생성일시"),
                                fieldWithPath("updatedAt").type(JsonFieldType.STRING).optional().description("수정일시"),
                                fieldWithPath("createdBy").type(JsonFieldType.STRING).optional().description("생성자"),
                                fieldWithPath("updatedBy").type(JsonFieldType.STRING).optional().description("수정자"),
                                fieldWithPath("eventType").type(JsonFieldType.STRING).optional().description("이벤트 유형 (POINT/RANGE)"),
                                fieldWithPath("endYear").type(JsonFieldType.NUMBER).optional().description("종료 연도 (RANGE일 때)"),
                                fieldWithPath("endMonth").type(JsonFieldType.NUMBER).optional().description("종료 월 (RANGE일 때)"),
                                fieldWithPath("endDay").type(JsonFieldType.NUMBER).optional().description("종료 일 (RANGE일 때)")
                        )
                ));
    }

    @Test
    void create() throws Exception {
        TimelineRequest request = new TimelineRequest(
                "제2차 세계대전 종전",
                "1945년 제2차 세계대전이 종전되었습니다.",
                List.of(1L),
                1945L,
                PrecisionLevel.YEAR,
                8,
                15,
                0,
                null,
                null,
                null,
                null,
                "유럽/태평양",
                "위키피디아",
                EventType.POINT,
                null,
                null,
                null
        );

        given(timelineService.create(any(Timeline.class), anyList())).willReturn(sampleTimeline);

        mockMvc.perform(RestDocumentationRequestBuilders.post("/api/timelines")
                        .contentType(MediaType.APPLICATION_JSON)
                        .accept(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andDo(document("timeline-create",
                        preprocessRequest(prettyPrint()),
                        preprocessResponse(prettyPrint()),
                        requestFields(
                                fieldWithPath("title").type(JsonFieldType.STRING).description("제목 (필수)"),
                                fieldWithPath("description").type(JsonFieldType.STRING).optional().description("설명"),
                                fieldWithPath("categoryIds").type(JsonFieldType.ARRAY).description("카테고리 ID 목록 (필수, 1개 이상)"),
                                fieldWithPath("eventYear").type(JsonFieldType.NUMBER).description("사건 연도 (필수)"),
                                fieldWithPath("precisionLevel").type(JsonFieldType.STRING).description("정밀도 레벨 (필수, BILLION_YEARS ~ SECOND)"),
                                fieldWithPath("eventMonth").type(JsonFieldType.NUMBER).optional().description("사건 월"),
                                fieldWithPath("eventDay").type(JsonFieldType.NUMBER).optional().description("사건 일"),
                                fieldWithPath("sortOrder").type(JsonFieldType.NUMBER).optional().description("정렬 순서 (기본값: 0)"),
                                fieldWithPath("eventLocalDateTime").type(JsonFieldType.STRING).optional().description("사건 로컬 일시"),
                                fieldWithPath("eventUtcDateTime").type(JsonFieldType.STRING).optional().description("사건 UTC 일시"),
                                fieldWithPath("timeZone").type(JsonFieldType.STRING).optional().description("타임존"),
                                fieldWithPath("uncertaintyYears").type(JsonFieldType.NUMBER).optional().description("불확실도 (년)"),
                                fieldWithPath("location").type(JsonFieldType.STRING).optional().description("위치"),
                                fieldWithPath("source").type(JsonFieldType.STRING).optional().description("출처"),
                                fieldWithPath("eventType").type(JsonFieldType.STRING).optional().description("이벤트 유형 (POINT/RANGE, 기본값: POINT)"),
                                fieldWithPath("endYear").type(JsonFieldType.NUMBER).optional().description("종료 연도 (RANGE일 때)"),
                                fieldWithPath("endMonth").type(JsonFieldType.NUMBER).optional().description("종료 월 (RANGE일 때)"),
                                fieldWithPath("endDay").type(JsonFieldType.NUMBER).optional().description("종료 일 (RANGE일 때)")
                        ),
                        responseFields(
                                fieldWithPath("id").type(JsonFieldType.NUMBER).description("타임라인 ID"),
                                fieldWithPath("title").type(JsonFieldType.STRING).description("제목"),
                                fieldWithPath("description").type(JsonFieldType.STRING).optional().description("설명"),
                                fieldWithPath("categoryIds").type(JsonFieldType.ARRAY).description("카테고리 ID 목록"),
                                fieldWithPath("categoryNames").type(JsonFieldType.ARRAY).description("카테고리명 목록"),
                                fieldWithPath("eventYear").type(JsonFieldType.NUMBER).description("사건 연도"),
                                fieldWithPath("precisionLevel").type(JsonFieldType.STRING).description("정밀도 레벨"),
                                fieldWithPath("eventMonth").type(JsonFieldType.NUMBER).optional().description("사건 월"),
                                fieldWithPath("eventDay").type(JsonFieldType.NUMBER).optional().description("사건 일"),
                                fieldWithPath("sortOrder").type(JsonFieldType.NUMBER).description("정렬 순서"),
                                fieldWithPath("eventLocalDateTime").type(JsonFieldType.STRING).optional().description("사건 로컬 일시"),
                                fieldWithPath("eventUtcDateTime").type(JsonFieldType.STRING).optional().description("사건 UTC 일시"),
                                fieldWithPath("timeZone").type(JsonFieldType.STRING).optional().description("타임존"),
                                fieldWithPath("uncertaintyYears").type(JsonFieldType.NUMBER).optional().description("불확실도 (년)"),
                                fieldWithPath("location").type(JsonFieldType.STRING).optional().description("위치"),
                                fieldWithPath("source").type(JsonFieldType.STRING).optional().description("출처"),
                                fieldWithPath("createdAt").type(JsonFieldType.STRING).optional().description("생성일시"),
                                fieldWithPath("updatedAt").type(JsonFieldType.STRING).optional().description("수정일시"),
                                fieldWithPath("createdBy").type(JsonFieldType.STRING).optional().description("생성자"),
                                fieldWithPath("updatedBy").type(JsonFieldType.STRING).optional().description("수정자"),
                                fieldWithPath("eventType").type(JsonFieldType.STRING).optional().description("이벤트 유형 (POINT/RANGE)"),
                                fieldWithPath("endYear").type(JsonFieldType.NUMBER).optional().description("종료 연도 (RANGE일 때)"),
                                fieldWithPath("endMonth").type(JsonFieldType.NUMBER).optional().description("종료 월 (RANGE일 때)"),
                                fieldWithPath("endDay").type(JsonFieldType.NUMBER).optional().description("종료 일 (RANGE일 때)")
                        )
                ));
    }

    @Test
    void update() throws Exception {
        TimelineRequest request = new TimelineRequest(
                "제2차 세계대전 종전 (수정)",
                "1945년 제2차 세계대전이 종전되었습니다. (수정)",
                List.of(1L),
                1945L,
                PrecisionLevel.YEAR,
                8,
                15,
                0,
                null,
                null,
                null,
                null,
                "유럽/태평양",
                "위키피디아",
                EventType.POINT,
                null,
                null,
                null
        );

        given(timelineService.update(anyLong(), any(Timeline.class), anyList())).willReturn(sampleTimeline);

        mockMvc.perform(RestDocumentationRequestBuilders.put("/api/timelines/{id}", 1L)
                        .contentType(MediaType.APPLICATION_JSON)
                        .accept(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andDo(document("timeline-update",
                        preprocessRequest(prettyPrint()),
                        preprocessResponse(prettyPrint()),
                        pathParameters(
                                parameterWithName("id").description("수정할 타임라인 ID")
                        ),
                        requestFields(
                                fieldWithPath("title").type(JsonFieldType.STRING).description("제목 (필수)"),
                                fieldWithPath("description").type(JsonFieldType.STRING).optional().description("설명"),
                                fieldWithPath("categoryIds").type(JsonFieldType.ARRAY).description("카테고리 ID 목록 (필수, 1개 이상)"),
                                fieldWithPath("eventYear").type(JsonFieldType.NUMBER).description("사건 연도 (필수)"),
                                fieldWithPath("precisionLevel").type(JsonFieldType.STRING).description("정밀도 레벨 (필수)"),
                                fieldWithPath("eventMonth").type(JsonFieldType.NUMBER).optional().description("사건 월"),
                                fieldWithPath("eventDay").type(JsonFieldType.NUMBER).optional().description("사건 일"),
                                fieldWithPath("sortOrder").type(JsonFieldType.NUMBER).optional().description("정렬 순서"),
                                fieldWithPath("eventLocalDateTime").type(JsonFieldType.STRING).optional().description("사건 로컬 일시"),
                                fieldWithPath("eventUtcDateTime").type(JsonFieldType.STRING).optional().description("사건 UTC 일시"),
                                fieldWithPath("timeZone").type(JsonFieldType.STRING).optional().description("타임존"),
                                fieldWithPath("uncertaintyYears").type(JsonFieldType.NUMBER).optional().description("불확실도 (년)"),
                                fieldWithPath("location").type(JsonFieldType.STRING).optional().description("위치"),
                                fieldWithPath("source").type(JsonFieldType.STRING).optional().description("출처"),
                                fieldWithPath("eventType").type(JsonFieldType.STRING).optional().description("이벤트 유형 (POINT/RANGE, 기본값: POINT)"),
                                fieldWithPath("endYear").type(JsonFieldType.NUMBER).optional().description("종료 연도 (RANGE일 때)"),
                                fieldWithPath("endMonth").type(JsonFieldType.NUMBER).optional().description("종료 월 (RANGE일 때)"),
                                fieldWithPath("endDay").type(JsonFieldType.NUMBER).optional().description("종료 일 (RANGE일 때)")
                        ),
                        responseFields(
                                fieldWithPath("id").type(JsonFieldType.NUMBER).description("타임라인 ID"),
                                fieldWithPath("title").type(JsonFieldType.STRING).description("제목"),
                                fieldWithPath("description").type(JsonFieldType.STRING).optional().description("설명"),
                                fieldWithPath("categoryIds").type(JsonFieldType.ARRAY).description("카테고리 ID 목록"),
                                fieldWithPath("categoryNames").type(JsonFieldType.ARRAY).description("카테고리명 목록"),
                                fieldWithPath("eventYear").type(JsonFieldType.NUMBER).description("사건 연도"),
                                fieldWithPath("precisionLevel").type(JsonFieldType.STRING).description("정밀도 레벨"),
                                fieldWithPath("eventMonth").type(JsonFieldType.NUMBER).optional().description("사건 월"),
                                fieldWithPath("eventDay").type(JsonFieldType.NUMBER).optional().description("사건 일"),
                                fieldWithPath("sortOrder").type(JsonFieldType.NUMBER).description("정렬 순서"),
                                fieldWithPath("eventLocalDateTime").type(JsonFieldType.STRING).optional().description("사건 로컬 일시"),
                                fieldWithPath("eventUtcDateTime").type(JsonFieldType.STRING).optional().description("사건 UTC 일시"),
                                fieldWithPath("timeZone").type(JsonFieldType.STRING).optional().description("타임존"),
                                fieldWithPath("uncertaintyYears").type(JsonFieldType.NUMBER).optional().description("불확실도 (년)"),
                                fieldWithPath("location").type(JsonFieldType.STRING).optional().description("위치"),
                                fieldWithPath("source").type(JsonFieldType.STRING).optional().description("출처"),
                                fieldWithPath("createdAt").type(JsonFieldType.STRING).optional().description("생성일시"),
                                fieldWithPath("updatedAt").type(JsonFieldType.STRING).optional().description("수정일시"),
                                fieldWithPath("createdBy").type(JsonFieldType.STRING).optional().description("생성자"),
                                fieldWithPath("updatedBy").type(JsonFieldType.STRING).optional().description("수정자"),
                                fieldWithPath("eventType").type(JsonFieldType.STRING).optional().description("이벤트 유형 (POINT/RANGE)"),
                                fieldWithPath("endYear").type(JsonFieldType.NUMBER).optional().description("종료 연도 (RANGE일 때)"),
                                fieldWithPath("endMonth").type(JsonFieldType.NUMBER).optional().description("종료 월 (RANGE일 때)"),
                                fieldWithPath("endDay").type(JsonFieldType.NUMBER).optional().description("종료 일 (RANGE일 때)")
                        )
                ));
    }

    @Test
    void delete() throws Exception {
        doNothing().when(timelineService).delete(anyLong());

        mockMvc.perform(RestDocumentationRequestBuilders.delete("/api/timelines/{id}", 1L))
                .andExpect(status().isNoContent())
                .andDo(document("timeline-delete",
                        preprocessRequest(prettyPrint()),
                        preprocessResponse(prettyPrint()),
                        pathParameters(
                                parameterWithName("id").description("삭제할 타임라인 ID")
                        )
                ));
    }
}

package com.timeline.api.controller;

import tools.jackson.databind.ObjectMapper;
import com.timeline.api.dto.CategoryRequest;
import com.timeline.core.domain.Category;
import com.timeline.core.service.CategoryService;
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

@WebMvcTest(CategoryController.class)
@ExtendWith(RestDocumentationExtension.class)
class CategoryControllerDocsTest {

    private MockMvc mockMvc;

    @Autowired
    private WebApplicationContext context;

    @MockitoBean
    private CategoryService categoryService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private Category sampleCategory;

    @BeforeEach
    void setUp(RestDocumentationContextProvider restDocumentation) {
        this.mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .apply(MockMvcRestDocumentation.documentationConfiguration(restDocumentation))
                .build();

        sampleCategory = new Category(
                1L,
                "역사",
                "역사 태그",
                LocalDateTime.of(2024, 1, 1, 0, 0),
                LocalDateTime.of(2024, 1, 1, 0, 0),
                "admin",
                "admin"
        );
    }

    @Test
    void findAll() throws Exception {
        given(categoryService.findAll()).willReturn(List.of(sampleCategory));

        mockMvc.perform(RestDocumentationRequestBuilders.get("/api/categories")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andDo(document("category-find-all",
                        preprocessRequest(prettyPrint()),
                        preprocessResponse(prettyPrint()),
                        responseFields(
                                fieldWithPath("[].id").type(JsonFieldType.NUMBER).description("태그 ID"),
                                fieldWithPath("[].name").type(JsonFieldType.STRING).description("태그명"),
                                fieldWithPath("[].description").type(JsonFieldType.STRING).optional().description("태그 설명"),
                                fieldWithPath("[].createdAt").type(JsonFieldType.STRING).optional().description("생성일시"),
                                fieldWithPath("[].updatedAt").type(JsonFieldType.STRING).optional().description("수정일시"),
                                fieldWithPath("[].createdBy").type(JsonFieldType.STRING).optional().description("생성자"),
                                fieldWithPath("[].updatedBy").type(JsonFieldType.STRING).optional().description("수정자")
                        )
                ));
    }

    @Test
    void findById() throws Exception {
        given(categoryService.findById(1L)).willReturn(Optional.of(sampleCategory));

        mockMvc.perform(RestDocumentationRequestBuilders.get("/api/categories/{id}", 1L)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andDo(document("category-find-by-id",
                        preprocessRequest(prettyPrint()),
                        preprocessResponse(prettyPrint()),
                        pathParameters(
                                parameterWithName("id").description("태그 ID")
                        ),
                        responseFields(
                                fieldWithPath("id").type(JsonFieldType.NUMBER).description("태그 ID"),
                                fieldWithPath("name").type(JsonFieldType.STRING).description("태그명"),
                                fieldWithPath("description").type(JsonFieldType.STRING).optional().description("태그 설명"),
                                fieldWithPath("createdAt").type(JsonFieldType.STRING).optional().description("생성일시"),
                                fieldWithPath("updatedAt").type(JsonFieldType.STRING).optional().description("수정일시"),
                                fieldWithPath("createdBy").type(JsonFieldType.STRING).optional().description("생성자"),
                                fieldWithPath("updatedBy").type(JsonFieldType.STRING).optional().description("수정자")
                        )
                ));
    }

    @Test
    void create() throws Exception {
        CategoryRequest request = new CategoryRequest("역사", "역사 태그");
        given(categoryService.create(any(Category.class))).willReturn(sampleCategory);

        mockMvc.perform(RestDocumentationRequestBuilders.post("/api/categories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .accept(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andDo(document("category-create",
                        preprocessRequest(prettyPrint()),
                        preprocessResponse(prettyPrint()),
                        requestFields(
                                fieldWithPath("name").type(JsonFieldType.STRING).description("태그명 (필수)"),
                                fieldWithPath("description").type(JsonFieldType.STRING).optional().description("태그 설명")
                        ),
                        responseFields(
                                fieldWithPath("id").type(JsonFieldType.NUMBER).description("태그 ID"),
                                fieldWithPath("name").type(JsonFieldType.STRING).description("태그명"),
                                fieldWithPath("description").type(JsonFieldType.STRING).optional().description("태그 설명"),
                                fieldWithPath("createdAt").type(JsonFieldType.STRING).optional().description("생성일시"),
                                fieldWithPath("updatedAt").type(JsonFieldType.STRING).optional().description("수정일시"),
                                fieldWithPath("createdBy").type(JsonFieldType.STRING).optional().description("생성자"),
                                fieldWithPath("updatedBy").type(JsonFieldType.STRING).optional().description("수정자")
                        )
                ));
    }

    @Test
    void update() throws Exception {
        CategoryRequest request = new CategoryRequest("역사 (수정)", "역사 태그 (수정)");
        given(categoryService.update(anyLong(), any(Category.class))).willReturn(sampleCategory);

        mockMvc.perform(RestDocumentationRequestBuilders.put("/api/categories/{id}", 1L)
                        .contentType(MediaType.APPLICATION_JSON)
                        .accept(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andDo(document("category-update",
                        preprocessRequest(prettyPrint()),
                        preprocessResponse(prettyPrint()),
                        pathParameters(
                                parameterWithName("id").description("수정할 태그 ID")
                        ),
                        requestFields(
                                fieldWithPath("name").type(JsonFieldType.STRING).description("태그명 (필수)"),
                                fieldWithPath("description").type(JsonFieldType.STRING).optional().description("태그 설명")
                        ),
                        responseFields(
                                fieldWithPath("id").type(JsonFieldType.NUMBER).description("태그 ID"),
                                fieldWithPath("name").type(JsonFieldType.STRING).description("태그명"),
                                fieldWithPath("description").type(JsonFieldType.STRING).optional().description("태그 설명"),
                                fieldWithPath("createdAt").type(JsonFieldType.STRING).optional().description("생성일시"),
                                fieldWithPath("updatedAt").type(JsonFieldType.STRING).optional().description("수정일시"),
                                fieldWithPath("createdBy").type(JsonFieldType.STRING).optional().description("생성자"),
                                fieldWithPath("updatedBy").type(JsonFieldType.STRING).optional().description("수정자")
                        )
                ));
    }

    @Test
    void delete() throws Exception {
        doNothing().when(categoryService).delete(anyLong());

        mockMvc.perform(RestDocumentationRequestBuilders.delete("/api/categories/{id}", 1L))
                .andExpect(status().isNoContent())
                .andDo(document("category-delete",
                        preprocessRequest(prettyPrint()),
                        preprocessResponse(prettyPrint()),
                        pathParameters(
                                parameterWithName("id").description("삭제할 태그 ID")
                        )
                ));
    }
}

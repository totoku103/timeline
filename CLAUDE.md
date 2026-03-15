# Timeline Project

다양한 사람들이 빅뱅부터 현재까지의 역사적 이벤트를 탐색하고 관리하는 한국어 인터랙티브 타임라인 시각화 웹앱.
이 디렉토리에서 frontend/backend/crawler를 통합 지휘한다.

## 핵심 컨셉

"시간축 x 태그 Row"의 **2차원 매트릭스**로 역사적 사건을 비교/학습하는 시각화 도구.

### 레이아웃
- **가로축 (X)**: 시간순 나열 (빅뱅 ~ 현재, symlog 스케일)
- **세로축 (Y)**: 태그 그룹별 **고정 Row** — 각 태그가 전용 행을 차지
- **상단 고정**: 시간축 (세로 스크롤 시에도 항상 상단에 sticky 고정)
- **좌측 고정**: 태그 이름 헤더

### 이벤트 유형
- **시점(point)**: 특정 시점 사건 → 점/원으로 표시 (예: 조선 건국 1392년)
- **기간(range)**: 시작~끝 사건 → 가로 바(bar)로 표시 (예: 임진왜란 1592-1598)

### 핵심 가치
동일 시간대에 여러 태그에서 어떤 사건이 동시에 일어났는지 **한눈에 비교/학습**.
태그별 Row가 고정되어 있으므로 시간축을 스크롤하면 각 분야의 사건이 정렬되어 보인다.

## 제품 방향 (확정)

- **타겟**: 다양한 사람들 (범용 역사 타임라인)
- **주력**: 2D (PixiJS). 3D는 보조/쇼케이스
- **언어**: 한국어
- **인증**: Spring Security (초기 관리자만 → 이후 로그인 사용자 확대)
- **데이터 규모**: 수만 건 → 페이지네이션 필수
- **CRUD UI**: 구현 예정 (모달/드로어)
- **모바일**: 향후 지원
- **이미지/미디어**: 향후 추가
- **공유/임베드**: 제외

## 프로젝트 구조

```
timeline/
├── backend/              # Spring Boot 4.0.3 (Java 25, Gradle 멀티모듈)
│   ├── timeline-core/    # 순수 도메인 모델, 서비스 인터페이스 (Spring 의존성 없음)
│   ├── timeline-infra/   # JPA 엔티티, Repository, 서비스 구현체
│   └── timeline-api/     # REST 컨트롤러, DTO, Spring Boot 진입점
├── frontend/             # React 19 + Vite 8 + TypeScript 5.9
│   └── src/
│       ├── engine/       # 커스텀 PixiJS 8 렌더링 엔진 (2D)
│       ├── samples/      # Three.js 3D 우주 타임라인
│       ├── api/          # fetch 기반 API 클라이언트
│       ├── store/        # Zustand 5 전역 상태
│       ├── hooks/        # TanStack Query + 엔진 라이프사이클
│       ├── components/   # React UI 컴포넌트
│       └── types/        # TypeScript 인터페이스
├── crawler/              # Python 3.12+ 데이터 크롤러
│   └── src/crawler/
│       ├── core/         # HTTP 클라이언트, API 클라이언트, 데이터 모델
│       └── spiders/
│           └── wikipedia/ # Wikidata SPARQL + MediaWiki API spider
└── README.md
```

## 기술 스택

### Backend
- Java 25, Spring Boot 4.0.3, Gradle 9.4 (Kotlin DSL)
- Spring Data JPA + Hibernate, PostgreSQL (Supabase)
- Hexagonal Architecture (Ports & Adapters)
- Spring REST Docs + Asciidoctor

### Frontend
- React 19, Vite 8, TypeScript 5.9 (strict)
- PixiJS 8 (커스텀 2D 엔진), Three.js + R3F (3D 모드)
- Zustand 5 (UI 상태), TanStack Query 5 (서버 상태)
- Plain CSS + CSS Custom Properties

### Crawler
- Python 3.12+, Click (CLI)
- Wikidata SPARQL (SPARQLWrapper) + MediaWiki API (httpx)
- Pydantic 2 (데이터 모델), BeautifulSoup4 (HTML 파싱)
- 2단계 파이프라인: Extract(→JSON) → Load(→Backend API)
- 데이터 적재는 항상 Backend REST API를 통해 수행

## 실행 방법

```bash
# Backend
DB_PASSWORD=xxx ./backend/gradlew -p backend :timeline-api:bootRun  # :8080

# Frontend
cd frontend && npm run dev  # :5173, /api → localhost:8080 프록시

# Crawler
cd crawler && python3 -m venv .venv && source .venv/bin/activate && pip install -e "."
timeline-crawler extract --min-sitelinks 20 -o data/wikipedia_events.json  # Wikidata 추출
timeline-crawler load -i data/wikipedia_events.json --api-url http://localhost:8080  # API 적재
timeline-crawler load -i data/wikipedia_events.json --dry-run  # 적재 미리보기
```

## API 엔드포인트

| Method | Path | 설명 |
|--------|------|------|
| GET | /api/categories | 전체 태그 |
| GET | /api/categories/{id} | 태그 상세 |
| POST | /api/categories | 태그 생성 |
| PUT | /api/categories/{id} | 태그 수정 |
| DELETE | /api/categories/{id} | 태그 삭제 |
| GET | /api/timelines | 전체 타임라인 |
| GET | /api/timelines/search | 검색 (fromYear, toYear, categoryId, precisionLevel) |
| GET | /api/timelines/{id} | 타임라인 상세 |
| POST | /api/timelines | 타임라인 생성 |
| PUT | /api/timelines/{id} | 타임라인 수정 |
| DELETE | /api/timelines/{id} | 타임라인 삭제 |

## 시드 태그 (12개)
과학, 기술, 정치, 전쟁, 문화, 자연, 경제, 종교, 사회, 탐험, 스포츠, 의학

## 알려진 갭 (우선순위순)

### 컨셉 구현 (최우선)
1. 데이터 모델에 종료 시점 추가 (endYear/endMonth/endDay, eventType) — BE + FE
2. NodeTransformer → 태그별 고정 Row + Row 내 서브레인으로 재설계 — FE 엔진
3. EventNodesLayer에 range bar 렌더링 추가 — FE 엔진
4. 시간축 상단 고정으로 이동 — FE 엔진
5. CategoryLaneLayer 신규 생성 (좌측 태그 헤더) — FE 엔진

### Backend
1. 글로벌 예외 핸들러 없음 — NoSuchElementException이 500으로 전파
2. 인증/인가 미구현 — AuditorAware가 항상 "system" 반환
3. 페이지네이션 미구현 — findAll()이 전체 반환
4. minPrecisionLevel 필터가 인메모리 — DB 쿼리로 이동 필요
5. 통합 테스트 없음 (Testcontainers 등)

### Frontend
1. 텍스트 검색이 API에 전달되지 않음 — searchQuery가 store에만 존재
2. 이벤트 생성/수정/삭제 UI 없음 — API 클라이언트는 준비됨
3. ZoomControls → PixiJS 엔진 양방향 동기화 미연결
4. 테스트 없음 (vitest 등 미설치)
5. 에러 바운더리 없음

## 개발 컨벤션

- Backend: Hexagonal Architecture — core는 순수 도메인, infra는 어댑터
- Frontend: 엔진(PixiJS)은 React 독립적인 순수 TypeScript 클래스
- 한국어 UI/데이터, 코드/커밋은 한국어 또는 영어

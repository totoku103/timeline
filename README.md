# Timeline

빅뱅부터 현재까지, 세계의 다양한 사건을 **시간축 x 카테고리**의 2차원 매트릭스로 시각화하는 한국어 인터랙티브 타임라인 웹앱입니다.

## 핵심 컨셉

- **가로축**: 시간순 나열 (빅뱅 ~ 현재, symlog 스케일)
- **세로축**: 카테고리별 고정 Row (과학, 정치, 전쟁, 문화 등)
- **이벤트 유형**: 시점(point) → 점/원, 기간(range) → 가로 바
- **핵심 가치**: 동일 시간대에 여러 분야의 사건을 한눈에 비교/학습

상단에 시간축이 고정되고, 좌측에 카테고리 헤더가 표시됩니다. 카테고리 Row가 많아져도 시간축은 항상 상단에 고정됩니다.

## 기술 스택

### Backend
- **언어**: Java 25
- **프레임워크**: Spring Boot 4.0.3
- **빌드 도구**: Gradle 9.4.0
- **데이터 접근**: Spring Data JPA, Hibernate
- **데이터베이스**: PostgreSQL
- **기타**: Lombok

### Frontend
- **라이브러리**: React 19.2.4
- **번들러**: Vite 8.0.0
- **언어**: TypeScript 5.9.3
- **스타일링**: CSS (기본 설정)
- **린터**: ESLint 9.39.4

## 프로젝트 구조

### Backend (멀티 모듈 구조)

```
backend/
├── timeline-core/        순수 도메인 모델, 비즈니스 로직
├── timeline-infra/       데이터 접근 계층, JPA 엔티티, Repository
└── timeline-api/         REST API 엔드포인트, DTO, 실행 가능한 JAR
```

#### timeline-core
- 순수한 도메인 모델과 비즈니스 로직
- Spring Web, JPA 의존성 없음
- Jakarta Validation API만 사용하여 도메인 제약 조건 정의

#### timeline-infra
- 데이터베이스 접근 계층
- JPA 엔티티 정의
- Repository 구현
- Hibernate 설정

#### timeline-api
- REST API 엔드포인트
- DTO (Data Transfer Object)
- Spring Boot 애플리케이션 부트스트랩
- timeline-core, timeline-infra 의존

### Frontend

```
frontend/
├── src/
│   ├── engine/           커스텀 PixiJS 8 렌더링 엔진 (2D 주력)
│   │   ├── data/         데이터 변환, 공간 인덱싱
│   │   ├── interaction/  팬/줌/터치 입력 처리
│   │   ├── layers/       렌더 레이어 (시간축, 이벤트 노드, 선택 오버레이)
│   │   └── scale/        symlog 스케일, 뷰포트 매니저, 줌 레벨 설정
│   ├── samples/          Three.js 3D 모드 (보조/쇼케이스)
│   ├── api/              fetch 기반 API 클라이언트
│   ├── store/            Zustand 전역 상태
│   ├── hooks/            TanStack Query + 엔진 라이프사이클
│   ├── components/       React UI 컴포넌트
│   └── types/            TypeScript 인터페이스
├── package.json          의존성 정의
└── vite.config.ts        Vite 설정
```

## 실행 방법

### 사전 요구사항

- Java 25 이상
- Node.js 18 이상
- npm 또는 yarn
- PostgreSQL (또는 설정된 데이터베이스)

### Backend 실행

1. 환경 변수 설정

```bash
export DB_PASSWORD=your_password
```

또는 한 줄에서:

```bash
DB_PASSWORD=your_password ./gradlew :timeline-api:bootRun
```

2. 실행

```bash
./gradlew :timeline-api:bootRun
```

서버는 `http://localhost:8080`에서 시작됩니다.

### Frontend 실행

1. 의존성 설치

```bash
cd frontend
npm install
```

2. 개발 서버 시작

```bash
npm run dev
```

개발 서버는 기본적으로 `http://localhost:5173`에서 시작됩니다.

3. 프로덕션 빌드

```bash
npm run build
```

빌드 결과물은 `dist/` 디렉토리에 생성됩니다.

## 환경 변수

### DB_PASSWORD

데이터베이스 연결 비밀번호입니다.

- **필수**: 예
- **설정 위치**: `backend/timeline-api/src/main/resources/application.yml`
- **사용처**: PostgreSQL 데이터베이스 인증

```bash
DB_PASSWORD=your_secure_password ./gradlew :timeline-api:bootRun
```

## 데이터베이스 설정

### 연결 정보

- **호스트**: aws-0-ap-northeast-2.pooler.supabase.com
- **포트**: 5432
- **데이터베이스**: postgres
- **사용자**: postgres.ogvxxvrwxorfxhlurora
- **비밀번호**: 환경변수 `DB_PASSWORD`로 설정

### Hibernate 설정

- **ddl-auto**: validate (기존 스키마 검증만 수행)
- **SQL 포맷팅**: 활성화
- **Dialect**: PostgreSQL

## 로깅

```
com.timeline: DEBUG
org.hibernate.SQL: DEBUG
```

Timeline 모듈과 Hibernate SQL 실행 로그가 DEBUG 레벨에서 출력됩니다.

## 빌드 및 테스트

### 전체 빌드

```bash
./gradlew build
```

### 특정 모듈 빌드

```bash
./gradlew :timeline-core:build
./gradlew :timeline-infra:build
./gradlew :timeline-api:build
```

### 테스트 실행

```bash
./gradlew test
```

## 개발 가이드

### Backend 구조 원칙

- **timeline-core**: 비즈니스 로직을 Spring과 분리하여 순수하게 유지
- **timeline-infra**: 모든 데이터 접근 로직을 격리
- **timeline-api**: 외부 요청을 처리하고 응답을 제공

이 구조는 테스트 용이성과 유지보수성을 향상시킵니다.

### Frontend 개발

TypeScript를 활용한 타입 안전한 개발 환경이 제공됩니다. Vite의 빠른 HMR(Hot Module Replacement)로 개발 생산성이 향상됩니다.

## 포트 정보

- **Backend**: 8080
- **Frontend (개발)**: 5173

## 라이선스

프로젝트 라이선스는 별도로 정의됩니다.

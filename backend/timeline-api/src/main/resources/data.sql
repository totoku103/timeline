-- 카테고리 기본 데이터
-- spring.sql.init.mode=always 로 설정 시 자동 실행

INSERT INTO categories (name, description, created_at, updated_at)
VALUES ('과학', '물리학, 화학, 생물학, 천문학 등 과학적 발견과 이론', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

INSERT INTO categories (name, description, created_at, updated_at)
VALUES ('기술', '기술 혁신, 발명, IT, 산업 혁명 등', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

INSERT INTO categories (name, description, created_at, updated_at)
VALUES ('정치', '정치적 사건, 법률, 제도, 외교 등', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

INSERT INTO categories (name, description, created_at, updated_at)
VALUES ('전쟁', '전쟁, 분쟁, 군사 작전, 평화 협정 등', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

INSERT INTO categories (name, description, created_at, updated_at)
VALUES ('문화', '예술, 문학, 음악, 영화, 건축 등', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

INSERT INTO categories (name, description, created_at, updated_at)
VALUES ('자연', '지질 활동, 기후 변화, 자연재해, 생태계 변화 등', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

INSERT INTO categories (name, description, created_at, updated_at)
VALUES ('경제', '경제 정책, 금융 위기, 무역, 산업 발전 등', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

INSERT INTO categories (name, description, created_at, updated_at)
VALUES ('종교', '종교적 사건, 교리, 종교 개혁, 성지 등', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

INSERT INTO categories (name, description, created_at, updated_at)
VALUES ('사회', '사회 운동, 인권, 교육, 인구 변화 등', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

INSERT INTO categories (name, description, created_at, updated_at)
VALUES ('탐험', '지리적 발견, 우주 탐사, 항해, 원정 등', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

INSERT INTO categories (name, description, created_at, updated_at)
VALUES ('스포츠', '올림픽, 월드컵, 스포츠 역사적 사건 등', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

INSERT INTO categories (name, description, created_at, updated_at)
VALUES ('의학', '의학적 발견, 전염병, 백신, 공중보건 등', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- 기존 단일 category_id 데이터를 timeline_categories 조인 테이블로 마이그레이션
INSERT INTO timeline_categories (timeline_id, category_id)
SELECT id, category_id FROM timelines
WHERE category_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- 기존 category_id 컬럼의 NOT NULL 제약 제거 (ManyToMany 전환 후 불필요)
ALTER TABLE timelines ALTER COLUMN category_id DROP NOT NULL;

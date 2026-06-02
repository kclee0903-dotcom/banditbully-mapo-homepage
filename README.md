# 반딧불이 새집증후군 랜딩페이지

브랜드형 랜딩페이지 정적 파일입니다.

## 구성

- `index.html`: 페이지 구조, SEO 메타 태그, 본문, FAQ, 카카오톡/전화 상담 연결
- `style.css`: 반응형 레이아웃, 브랜드 스타일, 모바일 하단 고정 상담 버튼, hero/시공 공정 이미지 스타일
- `script.js`: 헤더 스크롤 상태 처리

## 이미지 연결

Hero 이미지는 `public/images` 경로를 사용하고, 나머지 공정 이미지는 저장소 최상단의 기존 파일을 참조합니다.

- Hero 대표 이미지: `public/images/bandibuli-indoor-air-hero.png`
- 액상 공정: `KakaoTalk_20260528_172926361.jpg`
- 차폐 공정: `차폐.jpg`
- 오존 공정: `KakaoTalk_20260528_172926361_01.jpg`
- 공기정화 공정: `KakaoTalk_20260528_172926361_03.jpg`

## 상담 연결 정보

- 카카오톡 오픈채팅: https://open.kakao.com/o/scaooume
- 전화번호: 010-9921-3632 (`tel:01099213632`)

## 고객 리뷰 페이지와 관리자 기능

- 고객 리뷰 페이지: `reviews.html`
- 관리자 리뷰 페이지: `admin-reviews.html` 또는 Node 서버 실행 시 `/admin`, `/admin/reviews`
- 공개 리뷰 API: `GET /api/reviews`
- 관리자 API: 로그인 후 리뷰 작성, 수정, 삭제, 이미지 업로드 지원
- 리뷰 데이터 파일: `data/reviews.json`
- 업로드 이미지 저장 위치: `public/uploads/reviews/`

### 로컬 실행

```bash
ADMIN_ID=admin ADMIN_PASSWORD=change-me SESSION_SECRET=change-me-secret npm start
```

### 배포 전 환경변수

관리자 로그인 정보가 프론트엔드 코드에 노출되지 않도록 서버 환경변수로 설정해야 합니다.

- `ADMIN_ID`: 관리자 아이디
- `ADMIN_PASSWORD`: 관리자 비밀번호
- `SESSION_SECRET`: 관리자 세션 서명용 비밀값
- `PORT`: 선택 사항, 기본값 `3000`

### 파일 저장 유지 여부

현재 구현은 가장 단순한 파일 기반 저장 방식입니다. Node 서버가 실행되는 환경에서 `data/reviews.json`과 `public/uploads/reviews/`에 저장합니다. Vercel, Netlify Functions처럼 배포 후 파일시스템 변경이 유지되지 않는 서버리스 환경에서는 리뷰와 이미지가 영구 보존되지 않을 수 있으므로 Supabase, Firebase, Cloudinary 같은 외부 저장소 연동이 필요합니다.

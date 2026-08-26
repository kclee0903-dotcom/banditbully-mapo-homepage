# 반딧불이 새집증후군 랜딩페이지

브랜드형 정적 홈페이지입니다. 기존 메인 페이지, 상단 메뉴, 상담 문의 기능, SEO 메타태그는 유지하고 고객 리뷰 기능을 Supabase 기반 운영 구조로 분리했습니다.

## 주요 페이지

- 공개 고객 리뷰 페이지: `/reviews.html`
- 고객 후기 작성 페이지: `/review-submit.html`
- 고객 후기 확인 페이지: `/review-confirm.html?id=리뷰ID&token=확인토큰`
- 관리자 로그인 페이지: `/admin/login.html`
- 관리자 리뷰 관리 페이지: `/admin/reviews.html`

## 시공사례 정적 HTML 운영 방식

- 공개 시공사례 목록은 `/cases.html`, 상세페이지는 `/cases/case-001.html` 같은 정적 HTML 파일을 사용합니다.
- 고객이 보는 상세 본문과 이미지는 HTML에 직접 들어 있으므로 `cases.html?id=...` 방식이나 JavaScript 렌더링, localStorage/IndexedDB 저장소에 의존하지 않습니다.
- 새 시공사례를 추가할 때는 `cases/case-001.html` 파일을 복사해 `cases/case-002.html`처럼 만든 뒤 제목, 날짜, 이미지, 본문, 현장 요약 정보를 수정하세요.
- 새 상세페이지를 만든 뒤 `cases.html`의 기존 `<article class="case-card ...">` 카드를 복사해 링크, 대표 이미지, 제목, 요약을 새 파일명에 맞게 수정하세요.
- 작성/관리 기능이 실패하더라도 공개 목록과 상세페이지가 깨지지 않도록 공개 페이지에서는 `case-board.js`, `case-list.js`, `case-admin.js`를 불러오지 않습니다.
- `_generated` 폴더와 `scripts/build-cases.js`는 기존 정적 생성 미리보기/개발 보조 자료이며, 현재 공개 운영 링크는 `/cases.html`과 `/cases/*.html`을 기준으로 관리합니다.

## Supabase 설정 순서

1. Supabase 프로젝트를 생성합니다.
2. SQL Editor에서 `supabase/reviews-schema.sql` 전체를 실행해 `reviews` 테이블, RLS 정책, Storage 버킷 정책을 만듭니다.
3. Storage에서 `review-images` 버킷이 public으로 생성되어 있는지 확인합니다.
4. Project Settings > API의 Project URL과 anon public key를 `supabase-config.js`에 입력합니다.
5. Authentication > Users에서 관리자 이메일 계정을 생성하고 비밀번호를 설정합니다.
6. 관리자 사용자 metadata에 아래 중 하나를 설정합니다.
   - `app_metadata.is_admin = true`
   - 또는 `app_metadata.role = "admin"`

## 리뷰 운영 방식

- 고객 작성 리뷰는 `pending` 상태로만 저장됩니다.
- 공개 리뷰 페이지는 `approved` 상태만 조회하고 표시합니다.
- `pending`, `hidden`, `rejected` 리뷰는 공개 페이지에 표시하지 않습니다.
- 고객명, 전화번호, 이메일, 지역명, 현장명은 수집하지 않습니다.
- 고객 확인 페이지는 `id`와 `confirm_token`이 모두 일치할 때만 작성 내용을 보여줍니다.

## 이미지 업로드

- 버킷 이름: `review-images`
- 허용 파일: jpg, jpeg, png, webp, gif
- 용량 제한: jpg/jpeg/png/webp 5MB 이하, gif 10MB 이하
- 프론트엔드에서 파일명은 UUID 기반 안전한 이름으로 자동 변경됩니다.
- exe, zip, svg, html, js, script 파일은 허용하지 않습니다.
- GIF는 홈페이지 속도를 느리게 할 수 있으므로 꼭 필요한 경우에만 사용하세요.

## 배포 전 보안 확인

- `supabase-config.js`에는 Supabase URL과 anon key만 입력하세요.
- service_role key, 관리자 비밀번호, 관리자 이메일 목록을 프론트엔드에 넣지 마세요.
- 공개 전에는 모든 HTML 페이지에 `noindex, nofollow` 메타태그를 유지합니다.
- 공개 전에는 `robots.txt`에서 전체 경로를 차단하고, sitemap을 검색엔진에 제출하지 않습니다.
- RLS가 활성화되어 있고, 공개 사용자가 `approved` 이외 리뷰 목록을 읽을 수 없는지 확인하세요.
- 관리자 권한은 Supabase Auth 사용자 `app_metadata`로만 부여하세요.

## 현재 운영 도메인 설정

- 운영 도메인: `https://bandibuli-saejip.com/`
- `CNAME`과 공개 페이지의 canonical, Open Graph URL, 구조화 데이터, 사이트맵은 운영 도메인의 절대 URL을 사용합니다.
- 내부 페이지 이동은 `reviews.html`, `review-submit.html`, `admin/login.html`, `admin/reviews.html`처럼 상대경로를 사용합니다.
- 검색에서 제외할 중복 시공사례는 삭제하지 않고 `noindex, follow`로 유지합니다.
- 홈페이지는 시공·지역·상담 정보를 담당하고, 네이버 블로그는 상세 현장기록과 전문 정보 콘텐츠를 담당합니다.

# 반딧불이 새집증후군 랜딩페이지

브랜드형 정적 홈페이지입니다. 기존 메인 페이지, 상단 메뉴, 상담 문의 기능, SEO 메타태그는 유지하고 고객 리뷰 기능을 Supabase 기반 운영 구조로 분리했습니다.

## 주요 페이지

- 공개 고객 리뷰 페이지: `/reviews.html`
- 고객 후기 작성 페이지: `/review-submit.html`
- 고객 후기 확인 페이지: `/review-confirm.html?id=리뷰ID&token=확인토큰`
- 관리자 로그인 페이지: `/admin/login.html`
- 관리자 리뷰 관리 페이지: `/admin/reviews.html`

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
- `/admin/login.html`, `/admin/reviews.html`에는 `noindex` 메타태그가 있으며 `robots.txt`도 `/admin/`을 차단합니다.
- RLS가 활성화되어 있고, 공개 사용자가 `approved` 이외 리뷰 목록을 읽을 수 없는지 확인하세요.
- 관리자 권한은 Supabase Auth 사용자 `app_metadata`로만 부여하세요.

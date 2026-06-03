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
- 공개 전에는 모든 HTML 페이지에 `noindex, nofollow` 메타태그를 유지합니다.
- 공개 전에는 `robots.txt`에서 전체 경로를 차단하고, sitemap을 검색엔진에 제출하지 않습니다.
- RLS가 활성화되어 있고, 공개 사용자가 `approved` 이외 리뷰 목록을 읽을 수 없는지 확인하세요.
- 관리자 권한은 Supabase Auth 사용자 `app_metadata`로만 부여하세요.

## 현재 GitHub Pages 테스트 설정

- 아직 `bandibuli-saezip.com` 도메인을 구매하지 않은 상태이므로 GitHub Pages Settings의 **Custom domain은 비워둡니다.**
- 이 브랜치에서는 `CNAME` 파일을 제거해 GitHub Pages가 미구매 도메인으로 강제 연결되지 않게 했습니다.
- GitHub Pages 기본 주소는 저장소 소유자에 따라 `https://<GitHub-사용자명>.github.io/banditbully-mapo-homepage/` 형식입니다.
- 현재 저장소에는 Git remote가 설정되어 있지 않아 코드만으로 실제 `<GitHub-사용자명>` 값을 확인할 수 없습니다.
- 내부 페이지 이동은 `reviews.html`, `review-submit.html`, `admin/login.html`, `admin/reviews.html`처럼 도메인 없는 상대경로를 사용합니다.

## 도메인 구매 후 운영 전환 체크리스트

도메인을 구매하고 공개할 때 아래 항목을 `https://bandibuli-saezip.com` 기준으로 다시 설정하세요.

- GitHub Pages Settings > Custom domain: `bandibuli-saezip.com`
- `CNAME`: 파일을 다시 만들고 내용은 `bandibuli-saezip.com`만 입력
- 각 공개 HTML 페이지의 `canonical`: 운영 도메인의 절대 URL로 추가
- 각 공개 HTML 페이지의 `og:url`: 운영 도메인의 절대 URL로 추가
- `index.html`의 구조화 데이터 `url`, `logo`, `image`, `@id`: 운영 도메인의 절대 URL로 전환
- `sitemap.xml`: 공개 페이지 URL을 운영 도메인의 절대 URL로 채우고 검색엔진에 제출
- `robots.txt`: 전체 차단을 해제하고 필요한 관리자 경로만 차단
- Supabase Auth Site URL / Redirect URL allow list: 운영 도메인과 필요한 GitHub Pages 테스트 주소를 등록
- 관리자 화면이나 공유 버튼에서 생성되는 내부 공유 링크: 운영 도메인 기준으로 동작하는지 확인
- 네이버/구글 검색 등록 주소: 운영 도메인으로 등록

const REVIEW_DETAIL_SAMPLES = [
  {
    id: 'sample-review-new-home',
    nickname: '입주 전 점검 고객',
    site_type: '신축 아파트',
    rating: 5,
    review_text: '입주 전 새집 냄새가 생각보다 강해서 상담을 받았습니다. 어떤 공간을 먼저 봐야 하는지 차분히 설명해주셔서 일정 잡기가 편했습니다.',
    display_date: '2026-05-29',
    image_url: '',
    status: 'approved'
  },
  {
    id: 'sample-review-child-care',
    nickname: '아이 방 걱정 고객',
    site_type: '신축 아파트',
    rating: 5,
    review_text: '아이가 있어 입주 전에 새집증후군 관리를 꼭 하고 싶었습니다. 붙박이장과 아이 방 쪽을 꼼꼼히 봐주셔서 안심이 됐습니다.',
    display_date: '2026-05-26',
    image_url: '',
    status: 'approved'
  },
  {
    id: 'sample-review-renovation-smell',
    nickname: '올수리 후 상담 고객',
    site_type: '인테리어 후 냄새',
    rating: 4,
    review_text: '도배와 마루 공사 후 냄새가 오래 남아 문의했습니다. 냄새가 강한 부분과 새 가구 내부를 나눠서 설명해주신 점이 좋았습니다.',
    display_date: '2026-05-22',
    image_url: '',
    status: 'approved'
  }
];

const escapeReviewDetailHtml = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const formatReviewDetailDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
};

const renderReviewDetailStars = (rating = 5) => {
  const safeRating = Math.max(1, Math.min(5, Number(rating) || 5));
  return `<span aria-label="별점 ${safeRating}점">${'★'.repeat(safeRating)}${'☆'.repeat(5 - safeRating)}</span>`;
};

const renderReviewDetailText = (value = '') => {
  const urlPattern = /(https?:\/\/[^\s]+)/g;
  return String(value)
    .split(urlPattern)
    .map((part) => {
      if (/^https?:\/\//.test(part)) {
        const safeUrl = escapeReviewDetailHtml(part);
        return `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer">후기 원문 링크 열기</a>`;
      }
      return escapeReviewDetailHtml(part);
    })
    .join('');
};

const getReviewDetailClient = () => {
  const { createClient } = window.BANDIBULI_SUPABASE_HELPERS || {};
  if (!createClient) throw new Error('Supabase 연결 모듈을 불러오지 못했습니다.');
  return createClient();
};

const fetchApprovedReviewDetail = async (id) => {
  const sample = REVIEW_DETAIL_SAMPLES.find((review) => review.id === id);
  if (sample) return sample;

  const client = getReviewDetailClient();
  const { data, error } = await client
    .from('reviews')
    .select('id,nickname,site_type,rating,review_text,image_url,display_date,created_at,status')
    .eq('id', id)
    .eq('status', 'approved')
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error('승인된 고객 후기를 찾을 수 없습니다.');
  return data;
};

const renderApprovedReviewDetail = (review) => {
  const root = document.querySelector('[data-review-detail]');
  if (!root) return;

  document.title = `${review.nickname || '고객'} 후기 | 반딧불이 새집증후군`;
  root.innerHTML = `
    <header class="review-detail__head">
      <div>
        <p class="eyebrow">Real feedback</p>
        <h2>${escapeReviewDetailHtml(review.nickname || '익명 고객')}</h2>
      </div>
      <div class="review-stars review-detail__rating">${renderReviewDetailStars(review.rating)}</div>
    </header>
    <dl class="review-detail__meta">
      <div><dt>현장 유형</dt><dd>${escapeReviewDetailHtml(review.site_type || '-')}</dd></div>
      <div><dt>작성일</dt><dd>${formatReviewDetailDate(review.display_date || review.created_at)}</dd></div>
    </dl>
    ${review.image_url ? `
      <figure class="review-detail__image">
        <img src="${escapeReviewDetailHtml(review.image_url)}" alt="${escapeReviewDetailHtml(`${review.nickname || '고객'} 후기 이미지`)}" />
      </figure>
    ` : ''}
    <div class="review-detail__content">
      <h3>고객 후기</h3>
      <p>${renderReviewDetailText(review.review_text || '')}</p>
    </div>
    <div class="review-detail__actions">
      <a class="button button--secondary" href="reviews.html">고객후기 목록으로</a>
      <a class="button button--primary" href="index.html#contact">상담 문의하기</a>
    </div>
  `;
};

const renderReviewDetailError = (message) => {
  const root = document.querySelector('[data-review-detail]');
  if (!root) return;
  root.innerHTML = `
    <h2>고객 후기를 표시할 수 없습니다.</h2>
    <p>${escapeReviewDetailHtml(message)}</p>
    <div class="review-detail__actions">
      <a class="button button--secondary" href="reviews.html">고객후기 목록으로</a>
    </div>
  `;
};

const initReviewDetail = async () => {
  const id = new URLSearchParams(window.location.search).get('id') || '';
  if (!/^[a-zA-Z0-9-]{1,100}$/.test(id)) {
    renderReviewDetailError('올바른 고객후기 주소가 아닙니다.');
    return;
  }

  try {
    const review = await fetchApprovedReviewDetail(id);
    renderApprovedReviewDetail(review);
  } catch (error) {
    console.error(error);
    const { createStageError } = window.BANDIBULI_SUPABASE_HELPERS || {};
    const message = createStageError
      ? createStageError('고객후기 상세 조회', error).message
      : (error.message || '고객후기를 불러오지 못했습니다.');
    renderReviewDetailError(message);
  }
};

initReviewDetail();

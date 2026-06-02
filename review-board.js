const REVIEW_SITE_TYPES = ['신축 아파트', '구축 올수리', '새가구 반입', '인테리어 후 냄새', '대형시설', '기타'];
const REVIEW_STORAGE_KEY = 'bandibuliCustomerReviewsFallback';
const REVIEW_SEED = [
  {
    id: 'sample-review-new-home',
    name: '마포 입주 고객',
    siteType: '신축 아파트',
    location: '마포구 신축 아파트',
    rating: 5,
    content: '입주 전 새집 냄새가 생각보다 강해서 상담을 받았습니다. 어떤 공간을 먼저 봐야 하는지 차분히 설명해주셔서 일정 잡기가 편했습니다.',
    afterNote: '시공 후 바로 냄새가 완전히 사라졌다고 말하기보다는, 환기 방법까지 안내받고 며칠 지나면서 거실과 수납장 냄새가 한결 부담 없어졌습니다.',
    reviewDate: '2026-05-29',
    imageUrl: '',
    imageAlt: ''
  },
  {
    id: 'sample-review-child-care',
    name: '아이 방이 걱정됐던 고객',
    siteType: '신축 아파트',
    location: '상암동 입주 예정 세대',
    rating: 5,
    content: '아이가 있어 입주 전에 새집증후군 관리를 꼭 하고 싶었습니다. 붙박이장과 아이 방 쪽을 꼼꼼히 봐주셔서 안심이 됐습니다.',
    afterNote: '시공 후에는 수납장 문을 열어두는 방법과 입주 전 환기 시간을 구체적으로 알려주셔서 실천하기 쉬웠습니다.',
    reviewDate: '2026-05-26',
    imageUrl: '',
    imageAlt: ''
  },
  {
    id: 'sample-review-renovation-smell',
    name: '올수리 후 상담 고객',
    siteType: '인테리어 후 냄새',
    location: '공덕동 구축 올수리 현장',
    rating: 4,
    content: '도배와 마루 공사 후 냄새가 오래 남아 문의했습니다. 냄새가 강한 부분과 새 가구 내부를 나눠서 설명해주신 점이 좋았습니다.',
    afterNote: '시공 뒤에는 집에 들어갔을 때 처음 느껴지는 자극적인 냄새가 줄어든 느낌이었고, 추가 환기 관리도 계속하고 있습니다.',
    reviewDate: '2026-05-22',
    imageUrl: '',
    imageAlt: ''
  }
];

const escapeReviewHtml = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const formatReviewDate = (dateString) => new Intl.DateTimeFormat('ko-KR', {
  year: 'numeric', month: '2-digit', day: '2-digit'
}).format(new Date(dateString));

const sortReviews = (reviews) => [...reviews].sort((a, b) => new Date(b.reviewDate || b.createdAt) - new Date(a.reviewDate || a.createdAt));

const getFallbackReviews = () => {
  const stored = localStorage.getItem(REVIEW_STORAGE_KEY);
  if (stored) return sortReviews(JSON.parse(stored));
  localStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(REVIEW_SEED));
  return sortReviews(REVIEW_SEED);
};

const fetchPublicReviews = async () => {
  try {
    const response = await fetch('/api/reviews');
    if (!response.ok) throw new Error('API unavailable');
    return sortReviews(await response.json());
  } catch {
    return getFallbackReviews();
  }
};

const renderStars = (rating = 5) => {
  const safeRating = Math.max(1, Math.min(5, Number(rating) || 5));
  return `<span aria-label="별점 ${safeRating}점">${'★'.repeat(safeRating)}${'☆'.repeat(5 - safeRating)}</span>`;
};

const renderReviewCard = (review) => `
  <article class="review-card reveal-card">
    ${review.imageUrl ? `
      <figure class="review-card__image">
        <img src="${escapeReviewHtml(review.imageUrl)}" alt="${escapeReviewHtml(review.imageAlt || `${review.name} 후기 이미지`)}" loading="lazy" />
      </figure>
    ` : ''}
    <div class="review-card__body">
      <div class="review-card__head">
        <strong>${escapeReviewHtml(review.name)}</strong>
        <span class="review-stars">${renderStars(review.rating)}</span>
      </div>
      <dl class="review-card__meta">
        <div><dt>현장 유형</dt><dd>${escapeReviewHtml(review.siteType)}</dd></div>
        <div><dt>지역/현장명</dt><dd>${escapeReviewHtml(review.location || '-')}</dd></div>
      </dl>
      <p>${escapeReviewHtml(review.content)}</p>
      <blockquote>${escapeReviewHtml(review.afterNote)}</blockquote>
      <time datetime="${escapeReviewHtml(review.reviewDate)}">${formatReviewDate(review.reviewDate)}</time>
    </div>
  </article>
`;

const renderReviewList = async () => {
  const listNode = document.querySelector('[data-review-list]');
  const countNode = document.querySelector('[data-review-count]');
  const emptyNode = document.querySelector('[data-review-empty]');
  if (!listNode) return;
  const reviews = await fetchPublicReviews();
  listNode.innerHTML = reviews.map(renderReviewCard).join('');
  if (countNode) countNode.textContent = `총 ${reviews.length}개의 고객 리뷰가 등록되어 있습니다.`;
  if (emptyNode) emptyNode.hidden = reviews.length > 0;
};

if (document.querySelector('[data-review-list]')) {
  renderReviewList().catch((error) => {
    console.error(error);
    const countNode = document.querySelector('[data-review-count]');
    if (countNode) countNode.textContent = '고객 리뷰를 불러오지 못했습니다.';
  });
}

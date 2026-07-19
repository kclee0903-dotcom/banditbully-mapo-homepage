const REVIEW_SAMPLE_DATA = [
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

const escapeReviewHtml = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const formatReviewDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
};

const renderStars = (rating = 5) => {
  const safeRating = Math.max(1, Math.min(5, Number(rating) || 5));
  return `<span aria-label="별점 ${safeRating}점">${'★'.repeat(safeRating)}${'☆'.repeat(5 - safeRating)}</span>`;
};

const getSupabaseClient = () => {
  const config = window.BANDIBULI_SUPABASE;
  if (!window.supabase || !config?.url || !config?.anonKey || config.url.includes('YOUR_PROJECT_REF')) return null;
  return window.supabase.createClient(config.url, config.anonKey);
};

const fetchApprovedReviews = async () => {
  const client = getSupabaseClient();
  if (!client) return REVIEW_SAMPLE_DATA;
  const { data, error } = await client
    .from('reviews')
    .select('id,nickname,site_type,rating,review_text,image_url,display_date,created_at,status')
    .eq('status', 'approved')
    .order('display_date', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw error;
  const approvedReviews = data || [];
  const existingIds = new Set(approvedReviews.map((review) => review.id));
  const existingReviews = REVIEW_SAMPLE_DATA.filter((review) => !existingIds.has(review.id));
  return [...approvedReviews, ...existingReviews];
};

const renderReviewCard = (review) => `
  <article class="review-card">
    ${review.image_url ? `
      <figure class="review-card__image">
        <img src="${escapeReviewHtml(review.image_url)}" alt="${escapeReviewHtml(`${review.nickname} 후기 이미지`)}" loading="lazy" />
      </figure>
    ` : ''}
    <div class="review-card__body">
      <div class="review-card__head">
        <strong>${escapeReviewHtml(review.nickname || '익명')}</strong>
        <span class="review-stars">${renderStars(review.rating)}</span>
      </div>
      <dl class="review-card__meta">
        <div><dt>현장 유형</dt><dd>${escapeReviewHtml(review.site_type || '-')}</dd></div>
        <div><dt>작성일</dt><dd>${formatReviewDate(review.display_date || review.created_at)}</dd></div>
      </dl>
      <p>${escapeReviewHtml(review.review_text || '')}</p>
    </div>
  </article>
`;

const renderReviewList = async () => {
  const listNode = document.querySelector('[data-review-list]');
  const countNode = document.querySelector('[data-review-count]');
  const emptyNode = document.querySelector('[data-review-empty]');
  if (!listNode) return;
  const reviews = (await fetchApprovedReviews()).filter((review) => review.status === 'approved');
  listNode.innerHTML = reviews.map(renderReviewCard).join('');
  if (countNode) countNode.textContent = `총 ${reviews.length}개의 고객 리뷰가 등록되어 있습니다.`;
  if (emptyNode) emptyNode.hidden = reviews.length > 0;
};

if (document.querySelector('[data-review-list]')) {
  renderReviewList().catch((error) => {
    console.error(error);
    const countNode = document.querySelector('[data-review-count]');
    const listNode = document.querySelector('[data-review-list]');
    const sampleReviews = REVIEW_SAMPLE_DATA.filter((review) => review.status === 'approved');
    if (listNode) listNode.innerHTML = sampleReviews.map(renderReviewCard).join('');
    if (countNode) countNode.textContent = `총 ${sampleReviews.length}개의 고객 리뷰가 등록되어 있습니다.`;
  });
}

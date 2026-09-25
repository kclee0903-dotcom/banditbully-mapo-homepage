const getStaticReviewBackup = () => Array.isArray(window.BANDIBULI_REVIEW_BACKUP)
  ? window.BANDIBULI_REVIEW_BACKUP.filter((review) => review.status === 'approved')
  : [];

const mergeReviewSources = (liveReviews = []) => {
  const reviewsById = new Map(
    liveReviews
      .filter((review) => review?.id && review.status === 'approved')
      .map((review) => [review.id, review])
  );

  getStaticReviewBackup().forEach((backupReview) => {
    const liveReview = reviewsById.get(backupReview.id) || {};
    reviewsById.set(backupReview.id, { ...liveReview, ...backupReview, status: 'approved' });
  });

  const publishedReviews = [...reviewsById.values()].sort((a, b) => {
    const left = new Date(a.display_date || a.created_at || 0).getTime();
    const right = new Date(b.display_date || b.created_at || 0).getTime();
    return right - left;
  });
  return publishedReviews;
};

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

const createReviewDetailUrl = (reviewId) => `review-detail.html?id=${encodeURIComponent(String(reviewId || ''))}`;

const getSupabaseClient = () => {
  const { createClient } = window.BANDIBULI_SUPABASE_HELPERS || {};
  return createClient ? createClient() : null;
};

const fetchApprovedReviews = async () => {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase 연결 모듈을 불러오지 못했습니다.');
  try {
    const { data, error } = await client
      .from('reviews')
      .select('id,nickname,site_type,rating,review_text,image_url,display_date,created_at,status')
      .eq('status', 'approved')
      .order('display_date', { ascending: false })
      .order('created_at', { ascending: false });
    if (error) throw error;
    return mergeReviewSources(data || []);
  } catch (error) {
    const { createStageError } = window.BANDIBULI_SUPABASE_HELPERS || {};
    throw createStageError ? createStageError('고객후기 조회', error) : error;
  }
};

const renderReviewCard = (review) => `
  <article class="review-card">
    ${review.image_url ? `
      <a class="review-card__image" href="${createReviewDetailUrl(review.id)}" aria-label="${escapeReviewHtml(`${review.nickname || '고객'} 후기 자세히 보기`)}">
        <img src="${escapeReviewHtml(review.image_url)}" alt="${escapeReviewHtml(`${review.nickname} 후기 이미지`)}" loading="lazy" />
      </a>
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
      <p class="review-card__excerpt">${escapeReviewHtml(review.review_text || '')}</p>
      <a class="review-card__more" href="${createReviewDetailUrl(review.id)}" aria-label="${escapeReviewHtml(`${review.nickname || '고객'} 후기 자세히 보기`)}">자세히 보기</a>
    </div>
  </article>
`;

const renderHomeApprovedReviews = () => {
  const listNode = document.querySelector('[data-home-review-list]');
  if (!listNode) return;
  listNode.innerHTML = mergeReviewSources([]).slice(0, 3).map(renderReviewCard).join('');
};

const renderReviewList = async () => {
  const listNode = document.querySelector('[data-review-list]');
  const countNode = document.querySelector('[data-review-count]');
  const emptyNode = document.querySelector('[data-review-empty]');
  const statusNode = document.querySelector('[data-review-load-status]');
  if (!listNode) return;
  const reviews = (await fetchApprovedReviews()).filter((review) => review.status === 'approved');
  listNode.innerHTML = reviews.map(renderReviewCard).join('');
  if (countNode) countNode.textContent = `총 ${reviews.length}개의 고객 리뷰가 등록되어 있습니다.`;
  if (emptyNode) emptyNode.hidden = reviews.length > 0;
  if (statusNode) {
    statusNode.hidden = true;
    statusNode.textContent = '';
  }
};

renderHomeApprovedReviews();

if (document.querySelector('[data-review-list]')) {
  renderReviewList().catch((error) => {
    console.error(error);
    const countNode = document.querySelector('[data-review-count]');
    const listNode = document.querySelector('[data-review-list]');
    const statusNode = document.querySelector('[data-review-load-status]');
    const savedReviews = mergeReviewSources([]).filter((review) => review.status === 'approved');
    if (listNode) listNode.innerHTML = savedReviews.map(renderReviewCard).join('');
    if (countNode) countNode.textContent = `총 ${savedReviews.length}개의 고객 리뷰가 등록되어 있습니다.`;
    if (statusNode) {
      statusNode.hidden = false;
      statusNode.textContent = getStaticReviewBackup().length
        ? '고객후기 서버 연결이 지연되어 홈페이지에 안전하게 저장된 후기를 표시하고 있습니다.'
        : '고객후기 서버 연결이 지연되어 기본 후기를 표시하고 있습니다. 잠시 후 다시 확인해주세요.';
    }
  });
}

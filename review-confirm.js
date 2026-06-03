const escapeConfirmHtml = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const formatConfirmDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
};

const renderConfirmStars = (rating = 5) => {
  const safeRating = Math.max(1, Math.min(5, Number(rating) || 5));
  return `${'★'.repeat(safeRating)}${'☆'.repeat(5 - safeRating)}`;
};

const createConfirmClient = (token) => {
  const config = window.BANDIBULI_SUPABASE || {};
  if (!window.supabase || !config.url || !config.anonKey || config.url.includes('YOUR_PROJECT_REF')) {
    throw new Error('Supabase 설정이 필요합니다.');
  }
  return window.supabase.createClient(config.url, config.anonKey, {
    global: { headers: { 'x-confirm-token': token } }
  });
};

const invalidMarkup = '<h2>확인할 수 없는 후기입니다.</h2><p>확인 토큰이 없거나 일치하지 않습니다.</p><a class="button button--primary" href="index.html">홈페이지로 이동하기</a>';

const initConfirm = async () => {
  const root = document.querySelector('[data-review-confirm]');
  if (!root) return;
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const token = params.get('token');
  if (!id || !token) {
    root.innerHTML = invalidMarkup;
    return;
  }
  try {
    const client = createConfirmClient(token);
    const { data, error } = await client
      .from('reviews')
      .select('id,nickname,site_type,rating,review_text,image_url,status,display_date,created_at,confirm_token')
      .eq('id', id)
      .eq('confirm_token', token)
      .single();
    if (error || !data) throw error || new Error('not found');
    root.innerHTML = `
      <h2>접수 완료 안내</h2>
      <p>후기가 접수되었습니다. 작성하신 내용은 아래에서 확인하실 수 있습니다. 후기는 관리자 확인 후 고객 리뷰 페이지에 공개됩니다.</p>
      ${data.image_url ? `<figure class="review-card__image"><img src="${escapeConfirmHtml(data.image_url)}" alt="업로드 후기 이미지" /></figure>` : ''}
      <dl class="review-confirm-list">
        <div><dt>닉네임</dt><dd>${escapeConfirmHtml(data.nickname)}</dd></div>
        <div><dt>현장 유형</dt><dd>${escapeConfirmHtml(data.site_type)}</dd></div>
        <div><dt>별점</dt><dd class="review-stars">${renderConfirmStars(data.rating)}</dd></div>
        <div><dt>리뷰 내용</dt><dd>${escapeConfirmHtml(data.review_text)}</dd></div>
        <div><dt>현재 상태</dt><dd>승인 대기</dd></div>
        <div><dt>작성일</dt><dd>${formatConfirmDate(data.display_date || data.created_at)}</dd></div>
      </dl>
      <div class="review-confirm-actions">
        <button class="button button--secondary" type="button" data-copy-confirm-link>후기 링크 복사하기</button>
        <a class="button button--primary" href="index.html">홈페이지로 이동하기</a>
      </div>
    `;
    root.querySelector('[data-copy-confirm-link]')?.addEventListener('click', async () => {
      await navigator.clipboard.writeText(window.location.href);
      alert('후기 확인 링크를 복사했습니다.');
    });
  } catch (error) {
    console.error(error);
    root.innerHTML = invalidMarkup;
  }
};

initConfirm();

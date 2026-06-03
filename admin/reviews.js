const ADMIN_SITE_TYPES = ['신축 아파트', '구축 올수리', '새가구 반입', '인테리어 후 냄새', '대형시설', '기타'];
const ADMIN_STATUSES = ['pending', 'approved', 'hidden', 'rejected'];
const ADMIN_ALLOWED_TYPES = new Map([
  ['image/jpeg', { extension: 'jpg', maxBytes: 5 * 1024 * 1024 }],
  ['image/png', { extension: 'png', maxBytes: 5 * 1024 * 1024 }],
  ['image/webp', { extension: 'webp', maxBytes: 5 * 1024 * 1024 }],
  ['image/gif', { extension: 'gif', maxBytes: 10 * 1024 * 1024 }]
]);
const STATUS_LABELS = { pending: '승인 대기', approved: '승인된 리뷰', hidden: '비공개 리뷰', rejected: '반려 리뷰' };
let adminClient;
let currentStatus = 'pending';
let cachedReviews = [];

const escapeAdminHtml = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const getAdminConfig = () => window.BANDIBULI_SUPABASE || {};

const createAdminClient = () => {
  const config = getAdminConfig();
  if (!window.supabase || !config.url || !config.anonKey || config.url.includes('YOUR_PROJECT_REF')) {
    throw new Error('Supabase URL과 anon key를 supabase-config.js에 설정해주세요.');
  }
  return window.supabase.createClient(config.url, config.anonKey);
};

const setAdminError = (message = '') => {
  const node = document.querySelector('[data-admin-review-error]');
  if (node) node.textContent = message;
};

const formatAdminDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
};

const validateAdminImage = (file) => {
  if (!file) return null;
  const rule = ADMIN_ALLOWED_TYPES.get(file.type);
  if (!rule) return 'jpg, jpeg, png, webp, gif 파일만 업로드할 수 있습니다.';
  if (file.size > rule.maxBytes) return file.type === 'image/gif' ? 'GIF는 10MB 이하만 업로드할 수 있습니다.' : '이미지는 5MB 이하만 업로드할 수 있습니다.';
  return null;
};

const createSafeAdminPath = (file) => {
  const rule = ADMIN_ALLOWED_TYPES.get(file.type);
  const randomPart = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `admin/${new Date().toISOString().slice(0, 10)}/${randomPart}.${rule.extension}`;
};

const uploadAdminImage = async (file) => {
  if (!file) return '';
  const bucket = getAdminConfig().reviewImageBucket || 'review-images';
  const path = createSafeAdminPath(file);
  const { error } = await adminClient.storage.from(bucket).upload(path, file, {
    cacheControl: '31536000',
    contentType: file.type,
    upsert: false
  });
  if (error) throw error;
  const { data } = adminClient.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
};

const resetForm = () => {
  const form = document.querySelector('[data-admin-review-form]');
  if (!form) return;
  form.reset();
  form.elements.id.value = '';
  form.elements.image_url.value = '';
  form.elements.status.value = 'approved';
  document.querySelector('[data-form-title]').textContent = '관리자 직접 리뷰 작성';
  document.querySelector('[data-admin-image-preview]').innerHTML = '<p class="case-muted">업로드 이미지가 없으면 공개 리뷰 카드에서 이미지 영역이 보이지 않습니다.</p>';
  setAdminError('');
};

const renderImagePreview = (imageUrl = '') => {
  const preview = document.querySelector('[data-admin-image-preview]');
  if (!preview) return;
  preview.innerHTML = imageUrl
    ? `<div class="admin-media-item"><img src="${escapeAdminHtml(imageUrl)}" alt="이미지 미리보기" /><button class="button button--secondary" type="button" data-remove-image>이미지 삭제</button></div>`
    : '<p class="case-muted">업로드 이미지가 없으면 공개 리뷰 카드에서 이미지 영역이 보이지 않습니다.</p>';
};

const loadReviews = async () => {
  const { data, error } = await adminClient
    .from('reviews')
    .select('id,nickname,site_type,rating,review_text,image_url,status,display_date,created_at,updated_at,approved_at,consent_agreed')
    .order('created_at', { ascending: false });
  if (error) throw error;
  cachedReviews = data || [];
};

const renderReviews = () => {
  const list = document.querySelector('[data-admin-review-list]');
  const title = document.querySelector('[data-list-title]');
  if (title) title.textContent = STATUS_LABELS[currentStatus];
  document.querySelectorAll('[data-status-filter]').forEach((button) => {
    button.classList.toggle('button--primary', button.dataset.statusFilter === currentStatus);
    button.classList.toggle('button--secondary', button.dataset.statusFilter !== currentStatus);
  });
  const filtered = cachedReviews.filter((review) => review.status === currentStatus);
  list.innerHTML = filtered.map((review) => `
    <article class="admin-post-item">
      <div>
        <strong>${escapeAdminHtml(review.nickname)} · ${escapeAdminHtml(review.site_type)} · ${review.rating}점</strong>
        <span>${escapeAdminHtml(review.status)} · ${formatAdminDate(review.display_date || review.created_at)}</span>
      </div>
      ${review.image_url ? `<img class="admin-review-thumb" src="${escapeAdminHtml(review.image_url)}" alt="후기 이미지" />` : ''}
      <p>${escapeAdminHtml(review.review_text).slice(0, 180)}${review.review_text.length > 180 ? '…' : ''}</p>
      <div>
        <button class="button button--secondary" type="button" data-edit-review="${escapeAdminHtml(review.id)}">상세/수정</button>
        <button class="button button--secondary" type="button" data-status-review="${escapeAdminHtml(review.id)}" data-next-status="approved">승인</button>
        <button class="button button--secondary" type="button" data-status-review="${escapeAdminHtml(review.id)}" data-next-status="hidden">비공개</button>
        <button class="button button--secondary" type="button" data-status-review="${escapeAdminHtml(review.id)}" data-next-status="rejected">반려</button>
        <button class="button button--primary" type="button" data-delete-review="${escapeAdminHtml(review.id)}">삭제</button>
      </div>
    </article>
  `).join('') || '<p class="case-muted">해당 상태의 리뷰가 없습니다.</p>';
};

const refreshReviews = async () => {
  await loadReviews();
  renderReviews();
};

const editReview = (id) => {
  const review = cachedReviews.find((item) => item.id === id);
  const form = document.querySelector('[data-admin-review-form]');
  if (!review || !form) return;
  form.elements.id.value = review.id;
  form.elements.nickname.value = review.nickname || '';
  form.elements.site_type.value = ADMIN_SITE_TYPES.includes(review.site_type) ? review.site_type : '기타';
  form.elements.rating.value = String(review.rating || 5);
  form.elements.status.value = ADMIN_STATUSES.includes(review.status) ? review.status : 'pending';
  form.elements.review_text.value = review.review_text || '';
  form.elements.image_url.value = review.image_url || '';
  document.querySelector('[data-form-title]').textContent = '리뷰 상세 보기 및 수정';
  renderImagePreview(review.image_url || '');
  form.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

const changeStatus = async (id, status) => {
  const payload = { status, updated_at: new Date().toISOString() };
  if (status === 'approved') payload.approved_at = new Date().toISOString();
  const { error } = await adminClient.from('reviews').update(payload).eq('id', id);
  if (error) throw error;
  await refreshReviews();
};

const deleteReview = async (id) => {
  if (!confirm('이 리뷰를 삭제할까요? 삭제 후 복구할 수 없습니다.')) return;
  const { error } = await adminClient.from('reviews').delete().eq('id', id);
  if (error) throw error;
  await refreshReviews();
};

const initAdminEvents = () => {
  document.querySelectorAll('[data-status-filter]').forEach((button) => button.addEventListener('click', () => {
    currentStatus = button.dataset.statusFilter;
    renderReviews();
  }));

  document.querySelector('[data-admin-review-list]').addEventListener('click', async (event) => {
    const editId = event.target.closest('[data-edit-review]')?.dataset.editReview;
    const statusButton = event.target.closest('[data-status-review]');
    const deleteId = event.target.closest('[data-delete-review]')?.dataset.deleteReview;
    try {
      if (editId) editReview(editId);
      if (statusButton) await changeStatus(statusButton.dataset.statusReview, statusButton.dataset.nextStatus);
      if (deleteId) await deleteReview(deleteId);
    } catch (error) {
      console.error(error);
      setAdminError(error.message || '관리 중 오류가 발생했습니다.');
    }
  });

  document.querySelector('[data-admin-image-preview]').addEventListener('click', (event) => {
    if (!event.target.closest('[data-remove-image]')) return;
    const form = document.querySelector('[data-admin-review-form]');
    form.elements.image_url.value = '';
    renderImagePreview('');
  });

  document.querySelector('input[name="review_image"]').addEventListener('change', (event) => {
    const [file] = event.target.files || [];
    const error = validateAdminImage(file);
    if (error) {
      setAdminError(error);
      event.target.value = '';
      return;
    }
    setAdminError('');
    if (file) renderImagePreview(URL.createObjectURL(file));
  });

  document.querySelector('[data-admin-review-form]').addEventListener('submit', async (event) => {
    event.preventDefault();
    setAdminError('');
    const form = event.currentTarget;
    const formData = new FormData(form);
    const [file] = form.elements.review_image.files || [];
    const imageError = validateAdminImage(file);
    if (imageError) {
      setAdminError(imageError);
      return;
    }
    const status = String(formData.get('status'));
    const imageUrl = file ? await uploadAdminImage(file) : String(formData.get('image_url') || '');
    const payload = {
      nickname: String(formData.get('nickname') || '').trim(),
      site_type: ADMIN_SITE_TYPES.includes(formData.get('site_type')) ? formData.get('site_type') : '기타',
      rating: Number(formData.get('rating')),
      review_text: String(formData.get('review_text') || '').trim(),
      image_url: imageUrl,
      status,
      consent_agreed: true,
      updated_at: new Date().toISOString(),
      approved_at: status === 'approved' ? new Date().toISOString() : null
    };
    if (!payload.nickname || payload.review_text.length < 20) {
      setAdminError('닉네임과 20자 이상의 리뷰 내용을 입력해주세요.');
      return;
    }
    const id = String(formData.get('id') || '');
    const result = id
      ? await adminClient.from('reviews').update(payload).eq('id', id)
      : await adminClient.from('reviews').insert({ ...payload, confirm_token: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) });
    if (result.error) throw result.error;
    resetForm();
    await refreshReviews();
  });

  document.querySelector('[data-reset-form]').addEventListener('click', resetForm);
  document.querySelector('[data-new-review]').addEventListener('click', resetForm);
  document.querySelector('[data-copy-submit-link]').addEventListener('click', async () => {
    await navigator.clipboard.writeText(new URL('../review-submit.html', window.location.href).href);
    alert('고객 후기 작성 링크를 복사했습니다.');
  });
  document.querySelector('[data-admin-logout]').addEventListener('click', async () => {
    await adminClient.auth.signOut();
    window.location.href = 'login.html';
  });
};

const initAdminReviews = async () => {
  adminClient = createAdminClient();
  const { data: { session } } = await adminClient.auth.getSession();
  if (!session) {
    window.location.replace('login.html');
    return;
  }
  document.querySelector('[data-admin-app]').hidden = false;
  resetForm();
  initAdminEvents();
  await refreshReviews();
};

initAdminReviews().catch((error) => {
  console.error(error);
  if (String(error.message || '').includes('JWT')) window.location.replace('login.html');
  setAdminError(error.message || '관리자 페이지를 불러오지 못했습니다.');
});

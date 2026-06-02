const loginPanel = document.querySelector('[data-login-panel]');
const adminPanel = document.querySelector('[data-review-admin]');
const loginForm = document.querySelector('[data-login-form]');
const loginError = document.querySelector('[data-login-error]');
const reviewForm = document.querySelector('[data-review-form]');
const postsNode = document.querySelector('[data-admin-review-posts]');
const formModeNode = document.querySelector('[data-review-form-mode]');
const imageInput = document.querySelector('[data-review-image-input]');
const imagePreview = document.querySelector('[data-review-image-preview]');
const siteTypeSelect = document.querySelector('[data-review-site-type]');

const adminFetch = async (url, options = {}) => {
  const response = await fetch(url, {
    ...options,
    headers: options.body instanceof FormData ? options.headers : { 'Content-Type': 'application/json', ...(options.headers || {}) }
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '요청을 처리하지 못했습니다.' }));
    throw new Error(error.message || '요청을 처리하지 못했습니다.');
  }
  return response.json();
};

const fillSiteTypes = () => {
  siteTypeSelect.innerHTML = REVIEW_SITE_TYPES.map((type) => `<option value="${escapeReviewHtml(type)}">${escapeReviewHtml(type)}</option>`).join('');
};

const showAdmin = async () => {
  loginPanel.hidden = true;
  adminPanel.hidden = false;
  resetReviewForm();
  await renderAdminReviews();
};

const showLogin = () => {
  loginPanel.hidden = false;
  adminPanel.hidden = true;
};

const resetReviewForm = () => {
  reviewForm.reset();
  reviewForm.elements.id.value = '';
  reviewForm.elements.imageUrl.value = '';
  reviewForm.elements.imageAlt.value = '';
  reviewForm.elements.reviewDate.value = new Date().toISOString().slice(0, 10);
  formModeNode.textContent = '새 리뷰 작성';
  renderImagePreview();
};

const renderImagePreview = () => {
  const imageUrl = reviewForm.elements.imageUrl.value;
  const imageAlt = reviewForm.elements.imageAlt.value || '업로드 이미지 미리보기';
  imagePreview.innerHTML = imageUrl ? `
    <div class="admin-media-item">
      <img src="${escapeReviewHtml(imageUrl)}" alt="${escapeReviewHtml(imageAlt)}" />
      <div>
        <strong>${escapeReviewHtml(imageAlt)}</strong>
        <button class="button button--secondary" type="button" data-remove-review-image>이미지 삭제</button>
      </div>
    </div>
  ` : '<p class="case-muted">업로드한 이미지가 없으면 고객 리뷰 카드에서 이미지 영역이 보이지 않습니다.</p>';
};

const renderAdminReviews = async () => {
  const reviews = await adminFetch('/api/admin/reviews');
  postsNode.innerHTML = reviews.map((review) => `
    <article class="admin-post-item">
      <div>
        <strong>${escapeReviewHtml(review.name)} · ${escapeReviewHtml(review.siteType)}</strong>
        <span>${escapeReviewHtml(review.location || '-')} · ${formatReviewDate(review.reviewDate)} · ${'★'.repeat(Number(review.rating) || 5)}</span>
      </div>
      <p>${escapeReviewHtml(review.content).slice(0, 120)}${review.content.length > 120 ? '…' : ''}</p>
      <div>
        <button class="button button--secondary" type="button" data-edit-review="${escapeReviewHtml(review.id)}">수정</button>
        <button class="button button--primary" type="button" data-delete-review="${escapeReviewHtml(review.id)}">삭제</button>
      </div>
    </article>
  `).join('') || '<p class="case-muted">등록된 리뷰가 없습니다.</p>';
};

const loadReviewIntoForm = async (id) => {
  const reviews = await adminFetch('/api/admin/reviews');
  const review = reviews.find((item) => item.id === id);
  if (!review) return;
  reviewForm.elements.id.value = review.id;
  reviewForm.elements.name.value = review.name || '';
  reviewForm.elements.siteType.value = review.siteType || '기타';
  reviewForm.elements.location.value = review.location || '';
  reviewForm.elements.rating.value = review.rating || 5;
  reviewForm.elements.content.value = review.content || '';
  reviewForm.elements.afterNote.value = review.afterNote || '';
  reviewForm.elements.reviewDate.value = review.reviewDate || new Date().toISOString().slice(0, 10);
  reviewForm.elements.imageUrl.value = review.imageUrl || '';
  reviewForm.elements.imageAlt.value = review.imageAlt || '';
  formModeNode.textContent = '기존 리뷰 수정';
  renderImagePreview();
  reviewForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  loginError.textContent = '';
  const formData = new FormData(loginForm);
  try {
    await adminFetch('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ id: formData.get('id'), password: formData.get('password') })
    });
    await showAdmin();
  } catch (error) {
    loginError.textContent = error.message === '관리자 환경변수가 설정되지 않았습니다.'
      ? error.message
      : '아이디 또는 비밀번호를 확인해주세요.';
  }
});

imageInput.addEventListener('change', async () => {
  const [file] = imageInput.files || [];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) {
    alert('이미지는 5MB 이하만 업로드할 수 있습니다.');
    imageInput.value = '';
    return;
  }
  const previewUrl = URL.createObjectURL(file);
  imagePreview.innerHTML = `<div class="admin-media-item"><img src="${previewUrl}" alt="이미지 미리보기" /><div><strong>업로드 중...</strong></div></div>`;
  const uploadData = new FormData();
  uploadData.append('image', file);
  try {
    const result = await adminFetch('/api/admin/reviews/upload', { method: 'POST', body: uploadData });
    reviewForm.elements.imageUrl.value = result.imageUrl;
    reviewForm.elements.imageAlt.value = result.imageAlt;
    renderImagePreview();
  } catch (error) {
    alert(error.message);
    renderImagePreview();
  } finally {
    URL.revokeObjectURL(previewUrl);
    imageInput.value = '';
  }
});

imagePreview.addEventListener('click', (event) => {
  if (event.target.closest('[data-remove-review-image]')) {
    reviewForm.elements.imageUrl.value = '';
    reviewForm.elements.imageAlt.value = '';
    renderImagePreview();
  }
});

document.querySelectorAll('[data-new-review]').forEach((button) => button.addEventListener('click', resetReviewForm));

reviewForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(reviewForm);
  const payload = Object.fromEntries(formData.entries());
  const id = payload.id;
  const method = id ? 'PUT' : 'POST';
  const url = id ? `/api/admin/reviews/${encodeURIComponent(id)}` : '/api/admin/reviews';
  await adminFetch(url, { method, body: JSON.stringify(payload) });
  alert('고객 리뷰가 저장되었습니다.');
  resetReviewForm();
  await renderAdminReviews();
});

postsNode.addEventListener('click', async (event) => {
  const editId = event.target.closest('[data-edit-review]')?.dataset.editReview;
  const deleteId = event.target.closest('[data-delete-review]')?.dataset.deleteReview;
  if (editId) await loadReviewIntoForm(editId);
  if (deleteId && confirm('이 고객 리뷰를 삭제할까요?')) {
    await adminFetch(`/api/admin/reviews/${encodeURIComponent(deleteId)}`, { method: 'DELETE' });
    await renderAdminReviews();
  }
});

document.querySelector('[data-logout]').addEventListener('click', async () => {
  await adminFetch('/api/admin/logout', { method: 'POST', body: JSON.stringify({}) });
  showLogin();
});

const initReviewAdmin = async () => {
  fillSiteTypes();
  try {
    const session = await adminFetch('/api/admin/session');
    if (session.authenticated) await showAdmin();
    else showLogin();
  } catch {
    showLogin();
  }
};

initReviewAdmin().catch((error) => {
  console.error(error);
  showLogin();
});

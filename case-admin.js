const adminForm = document.querySelector('[data-admin-form]');
const categorySelect = document.querySelector('[data-category-select]');
const processOptions = document.querySelector('[data-process-options]');
const imageInput = document.querySelector('[data-image-input]');
const imageList = document.querySelector('[data-image-list]');
const coverSelect = document.querySelector('[data-cover-select]');
const videoInput = document.querySelector('[data-video-input]');
const videoPreview = document.querySelector('[data-video-preview]');
const postsNode = document.querySelector('[data-admin-posts]');
const formMode = document.querySelector('[data-form-mode]');
let currentImages = [];
let currentVideo = { type: 'youtube', url: '' };
let editingCreatedAt = '';

const fillSelects = () => {
  categorySelect.innerHTML = CASE_CATEGORIES.map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`).join('');
  processOptions.innerHTML = CASE_PROCESSES.map((process) => `
    <label><input type="checkbox" name="processes" value="${escapeHtml(process)}" /> <span>${escapeHtml(process)}</span></label>
  `).join('');
};

const refreshCoverSelect = (selectedId = '') => {
  coverSelect.innerHTML = '<option value="">사진 업로드 후 선택</option>' + currentImages.map((image) => `
    <option value="${escapeHtml(image.id)}" ${image.id === selectedId ? 'selected' : ''}>${escapeHtml(image.name)}</option>
  `).join('');
};

const insertAtCursor = (textarea, text) => {
  const start = textarea.selectionStart || 0;
  const end = textarea.selectionEnd || 0;
  const before = textarea.value.slice(0, start);
  const after = textarea.value.slice(end);
  textarea.value = `${before}${text}${after}`;
  const nextPosition = start + text.length;
  textarea.focus();
  textarea.setSelectionRange(nextPosition, nextPosition);
};

const renderImageList = () => {
  refreshCoverSelect(coverSelect.value);
  if (!currentImages.length) {
    imageList.innerHTML = '<p class="case-muted">아직 업로드한 사진이 없습니다.</p>';
    return;
  }
  imageList.innerHTML = currentImages.map((image) => `
    <article class="admin-media-item">
      <img src="${escapeHtml(image.dataUrl)}" alt="${escapeHtml(image.name)}" />
      <div>
        <strong>${escapeHtml(image.name)}</strong>
        <button class="button button--secondary" type="button" data-insert-image="${escapeHtml(image.name)}">본문에 넣기</button>
        <button class="button button--ghost" type="button" data-set-cover="${escapeHtml(image.id)}">대표로 설정</button>
        <button class="button button--secondary" type="button" data-remove-image="${escapeHtml(image.id)}">삭제</button>
      </div>
    </article>
  `).join('');
};

const renderVideoPreview = () => {
  const youtubeUrl = adminForm.elements.youtubeUrl.value.trim();
  if (youtubeUrl) {
    currentVideo = { type: 'youtube', url: youtubeUrl };
    videoPreview.innerHTML = `<p>유튜브 링크가 등록되었습니다: ${escapeHtml(youtubeUrl)}</p>`;
    return;
  }
  if (currentVideo.type === 'upload' && currentVideo.dataUrl) {
    videoPreview.innerHTML = `<video controls src="${escapeHtml(currentVideo.dataUrl)}"></video><button class="button button--secondary" type="button" data-remove-video>영상 삭제</button>`;
    return;
  }
  currentVideo = { type: 'youtube', url: '' };
  videoPreview.innerHTML = '<p class="case-muted">등록된 영상이 없습니다.</p>';
};

const resetForm = () => {
  adminForm.reset();
  adminForm.elements.id.value = '';
  currentImages = [];
  currentVideo = { type: 'youtube', url: '' };
  editingCreatedAt = '';
  formMode.textContent = '새 시공사례 작성';
  renderImageList();
  renderVideoPreview();
};

const renderPosts = async () => {
  const posts = await getAllCases();
  if (!posts.length) {
    postsNode.innerHTML = '<p class="case-muted">등록된 시공사례가 없습니다.</p>';
    return;
  }
  postsNode.innerHTML = posts.map((post) => `
    <article class="admin-post-item">
      <div>
        <strong>${escapeHtml(post.title)}</strong>
        <span>${escapeHtml(post.category)} · ${formatDate(post.createdAt)}</span>
      </div>
      <div>
        <a class="button button--ghost" href="cases.html?id=${encodeURIComponent(post.id)}">보기</a>
        <button class="button button--secondary" type="button" data-edit-post="${escapeHtml(post.id)}">수정</button>
        <button class="button button--secondary" type="button" data-delete-post="${escapeHtml(post.id)}">삭제</button>
      </div>
    </article>
  `).join('');
};

const loadPostIntoForm = async (id) => {
  const post = await getCaseById(id);
  if (!post) return;
  adminForm.elements.id.value = post.id;
  adminForm.elements.title.value = post.title;
  adminForm.elements.category.value = post.category;
  adminForm.elements.customerRequest.value = post.customerRequest;
  adminForm.elements.siteCondition.value = post.siteCondition;
  adminForm.elements.constructionPoint.value = post.constructionPoint;
  adminForm.elements.body.value = post.body;
  adminForm.elements.youtubeUrl.value = post.video?.type === 'youtube' ? post.video.url || '' : '';
  currentImages = [...(post.images || [])];
  currentVideo = post.video || { type: 'youtube', url: '' };
  editingCreatedAt = post.createdAt;
  document.querySelectorAll('input[name="processes"]').forEach((checkbox) => {
    checkbox.checked = (post.processes || []).includes(checkbox.value);
  });
  refreshCoverSelect(post.coverImageId);
  renderImageList();
  coverSelect.value = post.coverImageId || '';
  renderVideoPreview();
  formMode.textContent = '시공사례 수정 중';
  window.scrollTo({ top: adminForm.offsetTop - 90, behavior: 'smooth' });
};

imageInput.addEventListener('change', async () => {
  const previousCoverId = coverSelect.value;
  const media = await filesToMedia(imageInput.files);
  currentImages = [...currentImages, ...media];
  imageInput.value = '';
  renderImageList();
  coverSelect.value = previousCoverId || currentImages[0]?.id || '';
});

imageList.addEventListener('click', (event) => {
  const insertName = event.target.closest('[data-insert-image]')?.dataset.insertImage;
  const coverId = event.target.closest('[data-set-cover]')?.dataset.setCover;
  const removeId = event.target.closest('[data-remove-image]')?.dataset.removeImage;
  if (insertName) {
    insertAtCursor(adminForm.elements.body, `\n[사진:${insertName}]\n`);
  }
  if (coverId) {
    coverSelect.value = coverId;
  }
  if (removeId) {
    currentImages = currentImages.filter((image) => image.id !== removeId);
    renderImageList();
    coverSelect.value = currentImages[0]?.id || '';
  }
});

videoInput.addEventListener('change', async () => {
  const [video] = await filesToMedia(videoInput.files);
  if (video) {
    currentVideo = { type: 'upload', name: video.name, dataUrl: video.dataUrl, mime: video.type };
    adminForm.elements.youtubeUrl.value = '';
  }
  videoInput.value = '';
  renderVideoPreview();
});

adminForm.elements.youtubeUrl.addEventListener('input', renderVideoPreview);
videoPreview.addEventListener('click', (event) => {
  if (event.target.closest('[data-remove-video]')) {
    currentVideo = { type: 'youtube', url: '' };
    renderVideoPreview();
  }
});

document.querySelectorAll('[data-new-post]').forEach((button) => button.addEventListener('click', resetForm));

adminForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(adminForm);
  const id = formData.get('id') || `case-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const selectedProcesses = formData.getAll('processes');
  const youtubeUrl = String(formData.get('youtubeUrl') || '').trim();
  const video = youtubeUrl ? { type: 'youtube', url: youtubeUrl } : currentVideo;
  const caseItem = normalizeCase({
    id,
    title: formData.get('title'),
    category: formData.get('category'),
    customerRequest: formData.get('customerRequest'),
    siteCondition: formData.get('siteCondition'),
    constructionPoint: formData.get('constructionPoint'),
    processes: selectedProcesses,
    body: formData.get('body'),
    images: currentImages,
    coverImageId: formData.get('coverImageId') || currentImages[0]?.id || '',
    video,
    createdAt: editingCreatedAt || new Date().toISOString()
  });

  await saveCase(caseItem);
  alert('시공사례가 발행되었습니다.');
  resetForm();
  await renderPosts();
});

postsNode.addEventListener('click', async (event) => {
  const editId = event.target.closest('[data-edit-post]')?.dataset.editPost;
  const deleteId = event.target.closest('[data-delete-post]')?.dataset.deletePost;
  if (editId) await loadPostIntoForm(editId);
  if (deleteId && confirm('이 시공사례를 삭제할까요?')) {
    await deleteCaseById(deleteId);
    await renderPosts();
  }
});

const initAdmin = async () => {
  fillSelects();
  resetForm();
  await renderPosts();
};

initAdmin().catch((error) => {
  console.error(error);
  postsNode.innerHTML = '<p class="case-muted">관리자 데이터를 불러오지 못했습니다. 브라우저 저장소 권한을 확인해주세요.</p>';
});

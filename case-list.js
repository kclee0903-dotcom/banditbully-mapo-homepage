const listSection = document.querySelector('[data-case-list]');
const detailSection = document.querySelector('[data-case-detail]');
const searchForm = document.querySelector('[data-case-search]');
const emptyState = document.querySelector('[data-case-empty]');
const countNode = document.querySelector('[data-case-count]');
const categoryFilter = document.querySelector('[data-category-filter]');
const resetButton = document.querySelector('[data-reset-search]');
const listWrapper = document.querySelector('.case-list-section');
let allCases = [];

const params = new URLSearchParams(window.location.search);
const currentCaseId = params.get('id');

const renderCategoryOptions = () => {
  categoryFilter.innerHTML += CASE_CATEGORIES.map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`).join('');
};

const renderCaseCard = (caseItem) => {
  const cover = getCoverImage(caseItem);
  return `
    <article class="case-card reveal-card is-visible">
      <a class="case-card__image" href="cases.html?id=${encodeURIComponent(caseItem.id)}" aria-label="${escapeHtml(caseItem.title)} 상세 보기">
        ${cover ? `<img src="${escapeHtml(cover.dataUrl)}" alt="${escapeHtml(caseItem.title)} 대표 이미지" />` : '<span>대표 이미지 준비 중</span>'}
        <strong>${escapeHtml(caseItem.category)}</strong>
      </a>
      <div class="case-card__body">
        <div class="case-card__meta">
          <span>${escapeHtml(caseItem.category)}</span>
          <time datetime="${escapeHtml(caseItem.createdAt)}">${formatDate(caseItem.createdAt)}</time>
        </div>
        <h3><a href="cases.html?id=${encodeURIComponent(caseItem.id)}">${escapeHtml(caseItem.title)}</a></h3>
        <dl>
          <div><dt>고객 요청</dt><dd>${escapeHtml(caseItem.customerRequest)}</dd></div>
          <div><dt>시공 포인트</dt><dd>${escapeHtml(caseItem.constructionPoint)}</dd></div>
        </dl>
        <a class="case-card__more" href="cases.html?id=${encodeURIComponent(caseItem.id)}">자세히 보기</a>
      </div>
    </article>`;
};

const renderList = (items) => {
  listSection.innerHTML = items.map(renderCaseCard).join('');
  emptyState.hidden = items.length > 0;
  countNode.textContent = `총 ${items.length}개의 시공사례가 표시됩니다.`;
};

const filterCases = () => {
  const formData = new FormData(searchForm);
  const query = String(formData.get('query') || '').trim().toLowerCase();
  const category = String(formData.get('category') || '');
  const filtered = allCases.filter((caseItem) => {
    const searchable = [caseItem.title, caseItem.category, caseItem.customerRequest, caseItem.constructionPoint].join(' ').toLowerCase();
    return (!query || searchable.includes(query)) && (!category || caseItem.category === category);
  });
  renderList(filtered);
};

const renderBody = (caseItem) => {
  const imageMap = new Map((caseItem.images || []).map((image) => [image.name, image]));
  return escapeHtml(caseItem.body)
    .split('\n')
    .map((line) => {
      const token = line.trim().match(/^\[사진:(.+)]$/);
      if (token && imageMap.has(token[1])) {
        const image = imageMap.get(token[1]);
        return `<figure class="case-inline-image"><img src="${escapeHtml(image.dataUrl)}" alt="${escapeHtml(image.name)}" /><figcaption>${escapeHtml(image.name)}</figcaption></figure>`;
      }
      return line ? `<p>${line}</p>` : '';
    })
    .join('');
};

const renderVideo = (caseItem) => {
  if (!caseItem.video) return '';
  if (caseItem.video.type === 'upload' && caseItem.video.dataUrl) {
    return `<video controls src="${escapeHtml(caseItem.video.dataUrl)}"></video>`;
  }
  const embedUrl = getYoutubeEmbedUrl(caseItem.video.url || '');
  if (!embedUrl) return '<p class="case-muted">등록된 영상이 없습니다.</p>';
  return `<iframe src="${escapeHtml(embedUrl)}" title="${escapeHtml(caseItem.title)} 영상" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
};

const renderDetail = async () => {
  const caseItem = await getCaseById(currentCaseId);
  listWrapper.hidden = true;
  detailSection.hidden = false;

  if (!caseItem) {
    detailSection.innerHTML = '<article class="case-detail"><h2>시공사례를 찾을 수 없습니다</h2><a class="button button--primary" href="cases.html">목록으로 돌아가기</a></article>';
    return;
  }

  const cover = getCoverImage(caseItem);
  detailSection.innerHTML = `
    <article class="case-detail reveal-card is-visible">
      <div class="case-detail__head">
        <p class="eyebrow">${escapeHtml(caseItem.category)}</p>
        <h2>${escapeHtml(caseItem.title)}</h2>
        <time datetime="${escapeHtml(caseItem.createdAt)}">작성일 ${formatDate(caseItem.createdAt)}</time>
      </div>
      <div class="case-detail__cover">
        ${cover ? `<img src="${escapeHtml(cover.dataUrl)}" alt="${escapeHtml(caseItem.title)} 대표 이미지" />` : '<span>대표 이미지 준비 중</span>'}
      </div>
      <div class="case-detail__layout">
        <div class="case-detail__content">
          ${renderBody(caseItem)}
          <section class="case-gallery" aria-labelledby="case-gallery-title">
            <h3 id="case-gallery-title">이미지 갤러리</h3>
            <div>${(caseItem.images || []).map((image) => `<img src="${escapeHtml(image.dataUrl)}" alt="${escapeHtml(image.name)}" />`).join('')}</div>
          </section>
          <section class="case-video" aria-labelledby="case-video-title">
            <h3 id="case-video-title">동영상</h3>
            ${renderVideo(caseItem)}
          </section>
        </div>
        <aside class="case-detail__info" aria-label="현장 요약 정보">
          <dl>
            <div><dt>현장 유형</dt><dd>${escapeHtml(caseItem.category)}</dd></div>
            <div><dt>고객 요청</dt><dd>${escapeHtml(caseItem.customerRequest)}</dd></div>
            <div><dt>현장 상태</dt><dd>${escapeHtml(caseItem.siteCondition)}</dd></div>
            <div><dt>시공 포인트</dt><dd>${escapeHtml(caseItem.constructionPoint)}</dd></div>
            <div><dt>진행 공정</dt><dd>${(caseItem.processes || []).map(escapeHtml).join(' · ')}</dd></div>
          </dl>
          <div class="case-consult-box">
            <strong>우리 집도 상담이 필요하다면</strong>
            <a class="button button--secondary" href="tel:01099213632">전화 상담</a>
            <a class="button button--primary" href="https://open.kakao.com/o/scaooume" target="_blank" rel="noopener noreferrer">카카오 상담</a>
            <a class="button button--ghost" href="https://talk.naver.com/" target="_blank" rel="noopener noreferrer">네이버 톡톡 상담</a>
            <a class="button button--secondary" href="cases.html">목록으로 돌아가기</a>
          </div>
        </aside>
      </div>
    </article>`;
};

const initCasePage = async () => {
  renderCategoryOptions();
  if (currentCaseId) {
    await renderDetail();
    return;
  }
  allCases = await getAllCases();
  renderList(allCases);
  searchForm.addEventListener('submit', (event) => {
    event.preventDefault();
    filterCases();
  });
  searchForm.addEventListener('input', filterCases);
  resetButton.addEventListener('click', () => {
    searchForm.reset();
    filterCases();
  });
};

initCasePage().catch((error) => {
  console.error(error);
  if (countNode) countNode.textContent = '시공사례를 불러오지 못했습니다. 브라우저 저장소 권한을 확인해주세요.';
});

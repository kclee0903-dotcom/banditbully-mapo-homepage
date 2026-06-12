const listSection = document.querySelector('[data-case-list]');
const detailSection = document.querySelector('[data-case-detail]');
const searchForm = document.querySelector('[data-case-search]');
const emptyState = document.querySelector('[data-case-empty]');
const countNode = document.querySelector('[data-case-count]');
const categoryFilter = document.querySelector('[data-category-filter]');
const resetButton = document.querySelector('[data-reset-search]');
const listWrapper = document.querySelector('.case-list-section');
const caseHero = document.querySelector('.case-hero');
let allCases = [];

const params = new URLSearchParams(window.location.search);
const hasCaseIdParam = params.has('id');
const currentCaseId = params.get('id') || '';

const renderCategoryOptions = () => {
  if (!categoryFilter) return;
  categoryFilter.innerHTML += CASE_CATEGORIES.map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`).join('');
};

const getSafeCaseImages = (caseItem) => (Array.isArray(caseItem?.images) ? caseItem.images : [])
  .filter((image) => image && typeof image === 'object' && image.dataUrl);

const safeEscapeHtml = (value) => {
  if (typeof escapeHtml === 'function') return escapeHtml(value);
  return String(value ?? '').replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[char]));
};

const renderFallbackMessage = (message) => `<p class="case-muted">${safeEscapeHtml(message)}</p>`;

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
  if (!listSection || !emptyState || !countNode) return;
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

const getImageBlockKey = (block = {}) => String(block.imageId || block.src || block.dataUrl || block.caption || block.alt || '');

const getContentBlockImage = (caseItem, block = {}) => {
  const images = getSafeCaseImages(caseItem);
  if (block.imageId) return images.find((image) => image.id === block.imageId) || null;
  if (block.imageName) return images.find((image) => image.name === block.imageName) || null;
  if (block.src || block.dataUrl) {
    return {
      id: block.id || getImageBlockKey(block),
      name: block.caption || block.alt || '',
      dataUrl: block.src || block.dataUrl,
      type: block.type || 'image'
    };
  }
  return null;
};

const renderInlineImage = ({ src, alt, caption }) => {
  if (!src) return '';
  return `
  <figure class="case-inline-image">
    <img src="${safeEscapeHtml(src)}" alt="${safeEscapeHtml(alt || caption || '시공사례 이미지')}" loading="lazy" onerror="this.closest('figure').hidden=true" />
    ${caption ? `<figcaption>${safeEscapeHtml(caption)}</figcaption>` : ''}
  </figure>`;
};

const renderContentBlocks = (caseItem) => {
  if (!Array.isArray(caseItem?.contentBlocks) || caseItem.contentBlocks.length === 0) return '';

  return caseItem.contentBlocks.map((block) => {
    if (block?.type === 'image') {
      const image = getContentBlockImage(caseItem, block);
      if (!image?.dataUrl) return '';
      return renderInlineImage({
        src: image.dataUrl,
        alt: block.alt || image.name,
        caption: block.caption || image.name
      });
    }

    if (block?.type === 'text') {
      return String(block.text || '')
        .split('\n')
        .map((line) => line.trim() ? `<p>${safeEscapeHtml(line.trim())}</p>` : '')
        .join('');
    }

    return '';
  }).join('').trim();
};

const renderBody = (caseItem) => {
  const blockHtml = renderContentBlocks(caseItem);
  if (blockHtml) return blockHtml;

  const imageMap = new Map(getSafeCaseImages(caseItem).map((image) => [image.name, image]));
  const bodyHtml = safeEscapeHtml(caseItem?.body || '')
    .split('\n')
    .map((line) => {
      const token = line.trim().match(/^\[사진:(.+)]$/);
      if (token && imageMap.has(token[1])) {
        const image = imageMap.get(token[1]);
        return renderInlineImage({ src: image.dataUrl, alt: image.name, caption: image.name });
      }
      return line ? `<p>${line}</p>` : '';
    })
    .join('');

  return bodyHtml.trim() || renderFallbackMessage('등록된 본문이 없습니다.');
};

const safeRenderBody = (caseItem) => {
  try {
    return renderBody(caseItem);
  } catch (error) {
    console.error('[case-detail] body render failed', error);
    return renderFallbackMessage('본문을 불러오지 못했습니다.');
  }
};

const getContentBlockImageKeys = (caseItem) => {
  if (!Array.isArray(caseItem.contentBlocks)) return new Set();
  return new Set(caseItem.contentBlocks
    .filter((block) => block?.type === 'image')
    .map((block) => {
      const image = getContentBlockImage(caseItem, block);
      return image?.id || image?.dataUrl || getImageBlockKey(block);
    })
    .filter(Boolean));
};

const renderVideo = (caseItem) => {
  if (!caseItem?.video) return renderFallbackMessage('등록된 영상이 없습니다.');
  if (caseItem.video.type === 'upload' && caseItem.video.dataUrl) {
    return `<video controls src="${safeEscapeHtml(caseItem.video.dataUrl)}"></video>`;
  }
  const embedUrl = getYoutubeEmbedUrl(caseItem.video.url || '');
  if (!embedUrl) return renderFallbackMessage('등록된 영상이 없습니다.');
  return `<iframe src="${safeEscapeHtml(embedUrl)}" title="${safeEscapeHtml(caseItem.title)} 영상" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
};

const safeRenderVideo = (caseItem) => {
  try {
    return renderVideo(caseItem);
  } catch (error) {
    console.error('[case-detail] video render failed', error);
    return renderFallbackMessage('등록된 영상이 없습니다.');
  }
};

const findCaseById = (cases, id) => {
  const normalizedId = String(id || '');
  if (!normalizedId) return null;
  return cases.find((caseItem) => String(caseItem.id) === normalizedId) || null;
};

const revealDetailSection = () => {
  if (caseHero) caseHero.hidden = true;
  if (listWrapper) listWrapper.hidden = true;
  if (detailSection) detailSection.hidden = false;
};

const scrollToDetailSection = () => {
  if (detailSection) {
    detailSection.scrollIntoView({ behavior: 'auto', block: 'start' });
    return;
  }

  window.scrollTo(0, 0);
};

const renderDetailActions = () => `
  <div class="case-consult-box case-consult-box--fallback">
    <strong>상담이 필요하다면 바로 문의해주세요</strong>
    <a class="button button--secondary" href="cases.html">목록으로 돌아가기</a>
    <a class="button button--secondary" href="tel:01099213632">전화 상담</a>
    <a class="button button--primary" href="https://open.kakao.com/o/scaooume" target="_blank" rel="noopener noreferrer">카카오 상담</a>
  </div>`;

const renderNotFound = () => {
  detailSection.innerHTML = `
    <article class="case-detail">
      <h2>시공사례를 찾을 수 없습니다.</h2>
      <p class="case-muted">요청하신 시공사례가 삭제되었거나 주소가 변경되었을 수 있습니다.</p>
      ${renderDetailActions()}
    </article>`;
};

const renderDetailLoading = () => {
  if (!detailSection) return;
  detailSection.hidden = false;
  detailSection.innerHTML = '<article class="case-detail"><h2>시공사례를 불러오는 중입니다.</h2></article>';
};

const renderDetailError = (caseItem = null) => {
  if (!detailSection) return;
  const title = caseItem?.title || '시공사례를 불러오지 못했습니다.';
  const fallbackBody = caseItem?.body ? safeEscapeHtml(caseItem.body).split('\n').filter(Boolean).map((line) => `<p>${line}</p>`).join('') : renderFallbackMessage('일시적인 오류로 상세 일부를 불러오지 못했습니다. 아래 상담 버튼을 이용해주세요.');
  detailSection.innerHTML = `
    <article class="case-detail">
      <div class="case-detail__head">
        <p class="eyebrow">시공사례</p>
        <h2>${safeEscapeHtml(title)}</h2>
      </div>
      <section class="case-detail__body" aria-labelledby="case-fallback-body-title">
        <h3 id="case-fallback-body-title">본문 글</h3>
        ${fallbackBody || renderFallbackMessage('본문을 불러오지 못했습니다.')}
      </section>
      ${renderDetailActions()}
    </article>`;
};

const safeGetCoverImage = (caseItem) => {
  try {
    return getCoverImage(caseItem);
  } catch (error) {
    console.error('[case-detail] cover render failed', error);
    return null;
  }
};

const renderCover = (caseItem, cover) => `
  <div class="case-detail__cover">
    ${cover?.dataUrl ? `<img src="${safeEscapeHtml(cover.dataUrl)}" alt="${safeEscapeHtml(caseItem.title)} 대표 이미지" onerror="this.hidden=true;this.nextElementSibling.hidden=false" /><span hidden>대표 이미지 준비 중</span>` : '<span>대표 이미지 준비 중</span>'}
  </div>`;

const safeRenderAdditionalImages = (caseItem, cover) => {
  try {
    const contentBlockImageKeys = getContentBlockImageKeys(caseItem);
    const additionalImages = getSafeCaseImages(caseItem).filter((image) => image.id !== cover?.id && !contentBlockImageKeys.has(image.id) && !contentBlockImageKeys.has(image.dataUrl));
    if (!additionalImages.length) return '';
    return `
          <section class="case-gallery" aria-labelledby="case-gallery-title">
            <h3 id="case-gallery-title">추가 이미지</h3>
            <div>${additionalImages.map((image) => `<img src="${safeEscapeHtml(image.dataUrl)}" alt="${safeEscapeHtml(image.name)}" loading="lazy" onerror="this.hidden=true" />`).join('')}</div>
          </section>`;
  } catch (error) {
    console.error('[case-detail] gallery render failed', error);
    return '';
  }
};

const renderDetail = (cases) => {
  revealDetailSection();
  renderDetailLoading();
  let caseItem = null;

  try {
    caseItem = findCaseById(cases, currentCaseId);

    if (!caseItem) {
      renderNotFound();
      scrollToDetailSection();
      return;
    }

    const cover = safeGetCoverImage(caseItem);
    const additionalImages = safeRenderAdditionalImages(caseItem, cover);
    detailSection.innerHTML = `
    <article class="case-detail reveal-card is-visible">
      <div class="case-detail__head">
        <p class="eyebrow">${safeEscapeHtml(caseItem.category)}</p>
        <h2>${safeEscapeHtml(caseItem.title)}</h2>
        <time datetime="${safeEscapeHtml(caseItem.createdAt)}">작성일 ${formatDate(caseItem.createdAt)}</time>
      </div>
      ${renderCover(caseItem, cover)}
      <div class="case-detail__layout">
        <div class="case-detail__content">
          <section class="case-detail__body" aria-labelledby="case-body-title">
            <h3 id="case-body-title">본문 글</h3>
            ${safeRenderBody(caseItem)}
          </section>
          ${additionalImages}
          <section class="case-video" aria-labelledby="case-video-title">
            <h3 id="case-video-title">동영상</h3>
            ${safeRenderVideo(caseItem)}
          </section>
        </div>
        <aside class="case-detail__info" aria-label="현장 요약 정보">
          <dl>
            <div><dt>현장 유형</dt><dd>${safeEscapeHtml(caseItem.category)}</dd></div>
            <div><dt>날짜</dt><dd>${formatDate(caseItem.createdAt)}</dd></div>
            <div><dt>고객 요청</dt><dd>${safeEscapeHtml(caseItem.customerRequest)}</dd></div>
            <div><dt>현장 상태</dt><dd>${safeEscapeHtml(caseItem.siteCondition)}</dd></div>
            <div><dt>시공 포인트</dt><dd>${safeEscapeHtml(caseItem.constructionPoint)}</dd></div>
            <div><dt>진행 공정</dt><dd>${(caseItem.processes || []).map(safeEscapeHtml).join(' · ')}</dd></div>
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
    scrollToDetailSection();
  } catch (error) {
    console.error('[case-detail] render failed', error);
    renderDetailError(caseItem);
    scrollToDetailSection();
  }
};

const initCasePage = async () => {
  renderCategoryOptions();
  allCases = await getAllCases();
  if (hasCaseIdParam) {
    renderDetail(allCases);
    return;
  }
  renderList(allCases);
  if (searchForm) {
    searchForm.addEventListener('submit', (event) => {
      event.preventDefault();
      filterCases();
    });
    searchForm.addEventListener('input', filterCases);
  }
  if (resetButton && searchForm) {
    resetButton.addEventListener('click', () => {
      searchForm.reset();
      filterCases();
    });
  }
};

initCasePage().catch((error) => {
  console.error(error);
  if (hasCaseIdParam) {
    revealDetailSection();
    renderDetailError();
    scrollToDetailSection();
    return;
  }
  if (countNode) countNode.textContent = '시공사례를 불러오지 못했습니다. 브라우저 저장소 권한을 확인해주세요.';
});

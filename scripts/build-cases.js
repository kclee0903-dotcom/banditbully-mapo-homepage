#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const CONTENT_DIR = path.join(ROOT, 'content', 'cases');
const TEMPLATE_DIR = path.join(ROOT, 'templates');
const OUTPUT_DIR = path.join(ROOT, '_generated');
const TEMP_DIR = path.join(OUTPUT_DIR, `.cases-build-tmp-${process.pid}`);
const REQUIRED_FIELDS = [
  'title',
  'slug',
  'date',
  'category',
  'summary',
  'metaTitle',
  'metaDescription',
  'coverImage',
  'coverAlt',
  'siteType',
  'ctaText',
];

function fail(message) {
  throw new Error(`[build:cases] ${message}`);
}

function readText(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/`/g, '&#96;');
}

function parseScalar(raw) {
  const value = raw.trim();
  if (value === '[]') return [];
  if (value === '') return '';
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }
  return value;
}

function parseFrontmatterBlock(block) {
  const data = {};
  const lines = block.replace(/\r\n/g, '\n').split('\n');
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) {
      index += 1;
      continue;
    }

    const keyMatch = line.match(/^([A-Za-z][A-Za-z0-9_-]*):(?:\s*(.*))?$/);
    if (!keyMatch) {
      fail(`frontmatter 구문을 해석할 수 없습니다: ${line}`);
    }

    const [, key, rest = ''] = keyMatch;
    if (rest.trim() !== '') {
      data[key] = parseScalar(rest);
      index += 1;
      continue;
    }

    const items = [];
    index += 1;
    while (index < lines.length && /^\s+/.test(lines[index])) {
      const itemLine = lines[index];
      const scalarMatch = itemLine.match(/^\s*-\s+(.+)$/);
      const objectStartMatch = itemLine.match(/^\s*-\s+([A-Za-z][A-Za-z0-9_-]*):\s*(.*)$/);

      if (objectStartMatch) {
        const objectValue = {};
        objectValue[objectStartMatch[1]] = parseScalar(objectStartMatch[2]);
        index += 1;
        while (index < lines.length) {
          const childMatch = lines[index].match(/^\s{4,}([A-Za-z][A-Za-z0-9_-]*):\s*(.*)$/);
          if (!childMatch) break;
          objectValue[childMatch[1]] = parseScalar(childMatch[2]);
          index += 1;
        }
        items.push(objectValue);
        continue;
      }

      if (scalarMatch) {
        items.push(parseScalar(scalarMatch[1]));
        index += 1;
        continue;
      }

      fail(`frontmatter 배열 항목을 해석할 수 없습니다: ${itemLine}`);
    }
    data[key] = items;
  }

  return data;
}

function parseMarkdownFile(filePath) {
  const source = readText(filePath);
  const match = source.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) {
    fail(`${path.relative(ROOT, filePath)} 파일에 frontmatter가 없습니다.`);
  }

  return {
    frontmatter: parseFrontmatterBlock(match[1]),
    body: match[2].trim(),
    sourcePath: filePath,
  };
}

function inlineMarkdown(text) {
  return escapeHtml(text)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');
}

function renderParagraph(lines) {
  return `              <p>${inlineMarkdown(lines.join(' '))}</p>`;
}

function markdownToHtml(markdown) {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const html = [];
  let paragraph = [];

  const flushParagraph = () => {
    if (paragraph.length > 0) {
      html.push(renderParagraph(paragraph));
      paragraph = [];
    }
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim();

    if (!line) {
      flushParagraph();
      continue;
    }

    if (line.startsWith('<!--') && line.endsWith('-->')) {
      flushParagraph();
      continue;
    }

    const heading = line.match(/^(#{2,4})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      const level = heading[1].length;
      html.push(`              <h${level}>${inlineMarkdown(heading[2])}</h${level}>`);
      continue;
    }

    const image = line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (image) {
      flushParagraph();
      let caption = '';
      let captionIndex = index + 1;
      while (captionIndex < lines.length && !lines[captionIndex].trim()) {
        captionIndex += 1;
      }
      const nextLine = (lines[captionIndex] || '').trim();
      if (nextLine && !nextLine.startsWith('#') && !nextLine.startsWith('![') && !nextLine.startsWith('<!--')) {
        caption = nextLine;
        index = captionIndex;
      }
      html.push('              <figure class="case-inline-image">');
      html.push(`                <img src="${escapeAttribute(image[2])}" alt="${escapeAttribute(image[1])}" loading="lazy" />`);
      if (caption) {
        html.push(`                <figcaption>${inlineMarkdown(caption)}</figcaption>`);
      }
      html.push('              </figure>');
      continue;
    }

    paragraph.push(line);
  }

  flushParagraph();
  return html.join('\n');
}

function validateCase(caseItem, allSlugs) {
  for (const field of REQUIRED_FIELDS) {
    if (caseItem[field] === undefined || caseItem[field] === null || String(caseItem[field]).trim() === '') {
      fail(`${caseItem.fileName} 필수 필드 누락: ${field}`);
    }
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(caseItem.slug)) {
    fail(`${caseItem.fileName} slug는 영문 소문자, 숫자, 하이픈만 사용할 수 있습니다: ${caseItem.slug}`);
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(caseItem.date)) {
    fail(`${caseItem.fileName} date는 YYYY-MM-DD 형식이어야 합니다: ${caseItem.date}`);
  }

  const relatedCases = Array.isArray(caseItem.relatedCases) ? caseItem.relatedCases : [];
  for (const relatedSlug of relatedCases) {
    if (!allSlugs.has(relatedSlug)) {
      fail(`${caseItem.fileName} relatedCases에 존재하지 않는 slug가 있습니다: ${relatedSlug}`);
    }
  }
}

function formatDate(dateValue) {
  const [year, month, day] = dateValue.split('-');
  return `${year}. ${month}. ${day}.`;
}

function renderList(values) {
  if (!Array.isArray(values) || values.length === 0) return '';
  return `<ul>${values.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
}

function renderSidebar(caseItem) {
  const rows = [];
  const listFields = [
    ['고객 우려', caseItem.customerConcerns],
    ['점검 포인트', caseItem.inspectionPoints],
    ['시공 포인트', caseItem.constructionPoints],
    ['사후 관리', caseItem.afterCareGuide],
  ];

  if (caseItem.patentProcessSummary) {
    rows.push(`              <div><dt>특허 기반 공정 요약</dt><dd>${escapeHtml(caseItem.patentProcessSummary)}</dd></div>`);
  }

  for (const [label, values] of listFields) {
    const rendered = renderList(values);
    if (rendered) rows.push(`              <div><dt>${escapeHtml(label)}</dt><dd>${rendered}</dd></div>`);
  }

  return rows.join('\n');
}

function renderGallery(caseItem) {
  const images = Array.isArray(caseItem.galleryImages) ? caseItem.galleryImages : [];
  if (images.length === 0) return '';

  const renderedImages = images.map((image) => {
    const caption = image.caption ? `\n                <figcaption>${escapeHtml(image.caption)}</figcaption>` : '';
    return `              <figure class="case-inline-image">\n                <img src="${escapeAttribute(image.src)}" alt="${escapeAttribute(image.alt || '')}" loading="lazy" />${caption}\n              </figure>`;
  }).join('\n');

  return `
            <section class="case-gallery" aria-labelledby="case-gallery-title">
              <h2 id="case-gallery-title">참고 이미지</h2>
              <div>
${renderedImages}
              </div>
            </section>`;
}

function renderRelated(caseItem, casesBySlug) {
  const relatedCases = Array.isArray(caseItem.relatedCases) ? caseItem.relatedCases : [];
  if (relatedCases.length === 0) return '';

  const links = relatedCases.map((slug) => {
    const related = casesBySlug.get(slug);
    return `                <li><a href="_generated/cases/${escapeAttribute(slug)}.html">${escapeHtml(related.title)}</a></li>`;
  }).join('\n');

  return `
            <section class="case-gallery" aria-labelledby="related-cases-title">
              <h2 id="related-cases-title">관련 시공사례</h2>
              <ul>
${links}
              </ul>
            </section>`;
}

function siteHeader() {
  return `<header class="site-header" data-header>
    <a class="brand" href="index.html#top" aria-label="반딧불이 새집증후군 홈으로 이동">
      <img class="brand__icon" src="bandibuli-icon.png" alt="" aria-hidden="true" />
      <span>반딧불이 새집증후군</span>
    </a>
    <nav class="nav" aria-label="주요 메뉴">
      <a href="index.html#expert">시공정보</a>
      <a href="process.html">시공공정</a>
      <a href="cases.html">시공사례</a>
      <a href="index.html#videos">시공영상</a>
      <a href="reviews.html">고객 리뷰</a>
      <a href="index.html#faq">FAQ</a>
    </nav>
    <div class="header-actions" aria-label="상담 바로가기">
      <a class="header-phone" href="tel:01099213632">010-9921-3632</a>
      <a class="header-cta" href="https://open.kakao.com/o/scaooume" target="_blank" rel="noopener noreferrer">상담 문의</a>
    </div>
  </header>`;
}

function siteFooter() {
  return `<button class="top-button" type="button" aria-label="맨 위로 이동" aria-hidden="true">↑</button>
  <div class="mobile-fixed-actions" aria-label="모바일 빠른 상담 버튼">
    <a href="https://open.kakao.com/o/scaooume" target="_blank" rel="noopener noreferrer">카카오톡 상담</a>
    <a href="tel:01099213632">전화 상담</a>
  </div>`;
}

function applyTemplate(template, values) {
  return template.replace(/{{([A-Za-z0-9_]+)}}/g, (_, key) => {
    if (!(key in values)) fail(`템플릿 값이 없습니다: ${key}`);
    return values[key];
  });
}

function renderCaseCard(caseItem) {
  return `        <article class="case-card reveal-card is-visible">
          <a class="case-card__image" href="_generated/cases/${escapeAttribute(caseItem.slug)}.html" aria-label="${escapeAttribute(caseItem.title)} 상세 보기">
            <img src="${escapeAttribute(caseItem.coverImage)}" alt="${escapeAttribute(caseItem.coverAlt)}" loading="lazy" />
            <strong>${escapeHtml(caseItem.category)}</strong>
          </a>
          <div class="case-card__body">
            <div class="case-card__meta">
              <span>${escapeHtml(caseItem.siteType)}</span>
              <time datetime="${escapeAttribute(caseItem.date)}">${escapeHtml(formatDate(caseItem.date))}</time>
            </div>
            <h3><a href="_generated/cases/${escapeAttribute(caseItem.slug)}.html">${escapeHtml(caseItem.title)}</a></h3>
            <dl>
              <div><dt>요약</dt><dd>${escapeHtml(caseItem.summary)}</dd></div>
              <div><dt>시공 포인트</dt><dd>${escapeHtml(Array.isArray(caseItem.constructionPoints) ? caseItem.constructionPoints[0] : caseItem.patentProcessSummary || '')}</dd></div>
            </dl>
            <a class="case-card__more" href="_generated/cases/${escapeAttribute(caseItem.slug)}.html">자세히 보기</a>
          </div>
        </article>`;
}

function build() {
  if (!fs.existsSync(CONTENT_DIR)) fail('content/cases 폴더가 없습니다.');
  const markdownFiles = fs.readdirSync(CONTENT_DIR)
    .filter((fileName) => fileName.endsWith('.md'))
    .sort();
  if (markdownFiles.length === 0) fail('content/cases/*.md 원고가 없습니다.');

  const cases = markdownFiles.map((fileName) => {
    const parsed = parseMarkdownFile(path.join(CONTENT_DIR, fileName));
    return {
      ...parsed.frontmatter,
      bodyHtml: markdownToHtml(parsed.body),
      fileName,
    };
  });

  const slugs = new Set();
  for (const caseItem of cases) {
    if (slugs.has(caseItem.slug)) fail(`slug 중복: ${caseItem.slug}`);
    slugs.add(caseItem.slug);
  }
  for (const caseItem of cases) validateCase(caseItem, slugs);

  const casesBySlug = new Map(cases.map((caseItem) => [caseItem.slug, caseItem]));
  const listTemplate = readText(path.join(TEMPLATE_DIR, 'case-list.html'));
  const detailTemplate = readText(path.join(TEMPLATE_DIR, 'case-detail.html'));

  fs.rmSync(TEMP_DIR, { recursive: true, force: true });
  fs.mkdirSync(path.join(TEMP_DIR, 'cases'), { recursive: true });

  const listHtml = applyTemplate(listTemplate, {
    siteHeader: siteHeader(),
    siteFooter: siteFooter(),
    firstSlug: escapeAttribute(cases[0].slug),
    caseCount: String(cases.length),
    caseCards: cases.map(renderCaseCard).join('\n'),
  });
  fs.writeFileSync(path.join(TEMP_DIR, 'cases.html'), listHtml);

  for (const caseItem of cases) {
    const detailHtml = applyTemplate(detailTemplate, {
      siteHeader: siteHeader(),
      siteFooter: siteFooter(),
      metaTitle: escapeHtml(caseItem.metaTitle),
      metaDescription: escapeAttribute(caseItem.metaDescription),
      coverImage: escapeAttribute(caseItem.coverImage),
      coverAlt: escapeAttribute(caseItem.coverAlt),
      category: escapeHtml(caseItem.category),
      title: escapeHtml(caseItem.title),
      date: escapeAttribute(caseItem.date),
      displayDate: escapeHtml(formatDate(caseItem.date)),
      summary: escapeHtml(caseItem.summary),
      bodyHtml: caseItem.bodyHtml,
      galleryHtml: renderGallery(caseItem),
      relatedHtml: renderRelated(caseItem, casesBySlug),
      siteType: escapeHtml(caseItem.siteType),
      sidebarHtml: renderSidebar(caseItem),
      ctaText: escapeHtml(caseItem.ctaText),
    });
    fs.writeFileSync(path.join(TEMP_DIR, 'cases', `${caseItem.slug}.html`), detailHtml);
  }

  if (!fs.existsSync(path.join(TEMP_DIR, 'cases.html'))) fail('임시 목록 HTML 생성 검증 실패');
  for (const caseItem of cases) {
    if (!fs.existsSync(path.join(TEMP_DIR, 'cases', `${caseItem.slug}.html`))) {
      fail(`임시 상세 HTML 생성 검증 실패: ${caseItem.slug}`);
    }
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.copyFileSync(path.join(TEMP_DIR, 'cases.html'), path.join(OUTPUT_DIR, 'cases.html'));
  fs.rmSync(path.join(OUTPUT_DIR, 'cases'), { recursive: true, force: true });
  fs.renameSync(path.join(TEMP_DIR, 'cases'), path.join(OUTPUT_DIR, 'cases'));
  fs.rmSync(TEMP_DIR, { recursive: true, force: true });

  console.log(`[build:cases] ${cases.length}개 사례를 _generated/에 생성했습니다.`);
}

try {
  build();
} catch (error) {
  fs.rmSync(TEMP_DIR, { recursive: true, force: true });
  console.error(error.message);
  process.exit(1);
}

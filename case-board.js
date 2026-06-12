const CASE_DB_NAME = 'bandibuliConstructionCases';
const CASE_STORAGE_KEY = CASE_DB_NAME;
const CASE_DB_VERSION = 1;
const CASE_STORE_NAME = 'cases';
const CASE_CATEGORIES = ['신축 아파트', '구축 올수리', '아이 있는 집 / 올수리 아파트', '새가구 반입', '인테리어 후 냄새', '아이 있는 집', '대형시설', '기타'];
const CASE_PROCESSES = ['현장 점검', '유해물질 제거제', '차폐 공정', '오존 산화', '공기정화', '사후 환기 안내'];

const CASE_SEED = [
  {
    id: 'newborn-renovation-apartment',
    title: '신생아 입주를 앞둔 올수리 아파트 새집증후군 시공 사례',
    category: '아이 있는 집 / 올수리 아파트',
    customerRequest: '신생아와 영유아가 함께 생활할 공간이라 새집 냄새, 새가구 냄새, 실내공기질 걱정이 컸던 올수리 아파트 시공 사례입니다.',
    siteCondition: '일부 벽지 들뜸 우려가 있었고 붙박이 가구 내부와 선반, 서랍 안쪽에 마감 처리가 안 된 MDF·PB 절단면이 확인되었습니다.',
    constructionPoint: '민감한 가족을 위해 입주 전 새집증후군 관리 범위를 점검하고 액상 공정, 차폐 공정, 오존 산화, H14 집진 장비 공기정화를 순서대로 진행했습니다.',
    processes: ['현장 점검', '유해물질 제거제', '차폐 공정', '오존 산화', '공기정화', '사후 환기 안내'],
    body: `신생아 입주를 앞둔 올수리 아파트 새집증후군 시공 사례입니다.

고객님은 신생아와 영유아가 함께 생활할 공간이라 새집 냄새와 새가구 냄새, 실내공기질에 대한 걱정이 크셨습니다. 현장 확인 결과 일부 벽지 들뜸 우려가 있었고, 붙박이 가구 내부와 선반, 서랍 안쪽에는 마감 처리가 안 된 MDF·PB 절단면이 확인되었습니다.

시공 전에는 벽지 들뜸, 마감 상태, 가구 상태 등을 먼저 확인했습니다. 마감재에 부담이 가지 않도록 현장 상태에 맞춰 시공 범위를 안내했습니다.

붙박이장, 선반, 서랍 내부처럼 냄새가 올라올 수 있는 부분도 확인했습니다. 마감 처리가 안 된 MDF·PB 절단면은 집중 관리가 필요한 부위였습니다.

시공 전 포름알데히드와 라돈 수치를 확인하고, 공간 상태에 맞는 공정 순서를 정리했습니다.

벽지, 목재, 마감재, 가구 표면 등 오염원이 배출될 수 있는 부위에는 액상 공정을 진행했습니다. 포름알데히드 VOCs 실내공기 관리 관점에서 마감재 상태를 함께 살폈습니다.

서랍, 선반, MDF·PB 노출 부위에는 차폐제를 꼼꼼하게 시공했습니다.

이후 오존 산화 공정과 H14 집진 장비를 활용해 실내 공기 상태를 정리했습니다.

시공 후에는 환기 방법과 입주 전 관리 포인트를 안내드렸고, 진행 과정은 사진과 함께 공유해드렸습니다.

신생아 새집증후군, 아기 있는 집 새집증후군이 걱정되는 공간에서는 새집 냄새 제거, 새가구 냄새와 인테리어 냄새 제거를 단정적으로 약속하기보다 현장 상태를 확인하고 입주 전 실내공기 환경을 꾸준히 관리하는 과정이 중요합니다.

입주 전 새집증후군 시공은 단순히 냄새를 줄이는 작업이 아니라, 가구 내부·마감재·절단면 등 오염원이 남아 있을 수 있는 부분을 확인하고 공간 상태에 맞춰 관리하는 과정이 중요합니다.`,
    images: [
      { id: 'baby-case-1', name: '현장 하자 체크 / 벽지 들뜸, 마감 상태, 가구 상태 확인', dataUrl: 'images/baby-case-1.jpg', type: 'image/jpeg' },
      { id: 'baby-case-2', name: '서랍·선반·가구 내부 확인 / MDF·PB 절단면 확인', dataUrl: 'images/baby-case-2.jpg', type: 'image/jpeg' },
      { id: 'baby-case-3', name: '사전 측정 / 포름알데히드와 라돈 수치 확인', dataUrl: 'images/baby-case-3.jpg', type: 'image/jpeg' },
      { id: 'baby-case-4', name: '액상 공정', dataUrl: 'images/baby-case-4.jpg', type: 'image/jpeg' },
      { id: 'baby-case-5', name: '차폐 공정', dataUrl: 'images/baby-case-5.jpg', type: 'image/jpeg' },
      { id: 'baby-case-6', name: '오존 공정', dataUrl: 'images/baby-case-6.jpg', type: 'image/jpeg' },
      { id: 'baby-case-7', name: 'H14 집진 장비 공기정화 공정', dataUrl: 'images/baby-case-7.jpg', type: 'image/jpeg' },
      { id: 'baby-case-8', name: '시공 후 안내 및 입주 전 관리 포인트', dataUrl: 'images/baby-case-8.jpg', type: 'image/jpeg' }
    ],
    coverImageId: 'baby-case-1',
    video: { type: 'youtube', url: '' },
    createdAt: '2026-06-12T09:00:00.000Z',
    updatedAt: '2026-06-12T09:00:00.000Z'
  },
  {
    id: 'sample-new-apartment',
    title: '입주 전 신축 아파트 새집증후군 집중 관리',
    category: '신축 아파트',
    customerRequest: '입주 전 아이 방과 거실 냄새가 걱정되어 전체 공정 상담을 요청했습니다.',
    siteCondition: '도배·마루 마감 직후 붙박이장과 신발장 내부에서 새집 냄새가 강하게 느껴졌습니다.',
    constructionPoint: '수납공간 내부와 생활 동선을 중심으로 오염 발생원을 확인하고 특허 4단계 공정을 적용했습니다.',
    processes: ['현장 점검', '유해물질 제거제', '차폐 공정', '오존 산화', '공기정화'],
    body: '입주 전 공간 전체를 확인한 뒤 거실, 아이 방, 붙박이장, 신발장처럼 체감 냄새가 강한 구역을 우선 관리했습니다.\n\n마감재와 새 가구가 만나는 부분은 냄새가 오래 남을 수 있어 차폐 공정과 공기정화 공정을 함께 진행했습니다. 시공 후에는 입주 전 환기 방법과 수납장 개방 관리 방법을 안내했습니다.',
    images: [
      { id: 'seed-hero-1', name: '신축 아파트 거실 점검', dataUrl: 'public/images/bandibuli-indoor-air-hero.png', type: 'image/png' },
      { id: 'seed-hero-2', name: '새집증후군 진단', dataUrl: 'new-house-syndrome-inspection.png', type: 'image/png' }
    ],
    coverImageId: 'seed-hero-1',
    video: { type: 'youtube', url: '' },
    createdAt: '2026-05-28T09:00:00.000Z',
    updatedAt: '2026-05-28T09:00:00.000Z'
  },
  {
    id: 'sample-renovation',
    title: '구축 올수리 후 인테리어 냄새 저감 시공',
    category: '구축 올수리',
    customerRequest: '도배, 마루, 필름 시공 후 남은 냄새 때문에 입주 전 관리를 원했습니다.',
    siteCondition: '마루 접착제와 필름 시공 부위, 새 가구 내부 냄새가 복합적으로 남아 있었습니다.',
    constructionPoint: '냄새가 강한 마감재 주변과 수납공간을 분리 점검하고 공정별로 반복 관리했습니다.',
    processes: ['현장 점검', '유해물질 제거제', '차폐 공정', '공기정화'],
    body: '올수리 현장은 여러 자재 냄새가 섞여 체감 불편감이 커질 수 있습니다. 현장에서는 냄새가 강한 구역을 먼저 확인하고, 고객이 생활 중 오래 머무는 침실과 거실을 중심으로 관리 범위를 정했습니다.\n\n시공 후에는 마감재 손상 우려가 없는 범위에서 환기와 수납장 개방 관리 방법을 안내했습니다.',
    images: [
      { id: 'seed-reno-1', name: '공정 장비 현장 사진', dataUrl: 'KakaoTalk_20260528_172926361.jpg', type: 'image/jpeg' },
      { id: 'seed-reno-2', name: '차폐 공정 사진', dataUrl: '차폐.jpg', type: 'image/jpeg' }
    ],
    coverImageId: 'seed-reno-1',
    video: { type: 'youtube', url: '' },
    createdAt: '2026-05-24T09:00:00.000Z',
    updatedAt: '2026-05-24T09:00:00.000Z'
  }
];

const openCaseDb = () => new Promise((resolve, reject) => {
  const request = indexedDB.open(CASE_DB_NAME, CASE_DB_VERSION);
  request.onupgradeneeded = () => {
    const db = request.result;
    if (!db.objectStoreNames.contains(CASE_STORE_NAME)) {
      db.createObjectStore(CASE_STORE_NAME, { keyPath: 'id' });
    }
  };
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});

const getLegacyIndexedDbCases = async () => {
  if (typeof indexedDB === 'undefined') return [];
  try {
    const db = await openCaseDb();
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction(CASE_STORE_NAME, 'readonly');
      const request = transaction.objectStore(CASE_STORE_NAME).getAll();
      request.onsuccess = () => {
        db.close();
        resolve(Array.isArray(request.result) ? request.result : []);
      };
      request.onerror = () => {
        db.close();
        reject(request.error);
      };
    });
  } catch (error) {
    console.warn('IndexedDB 시공사례 마이그레이션을 건너뜁니다.', error);
    return [];
  }
};

const getCaseDateKey = (caseItem) => {
  const date = new Date(caseItem?.createdAt || '');
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
};

const getCaseDuplicateKey = (caseItem) => [
  String(caseItem?.title || '').trim().toLowerCase(),
  getCaseDateKey(caseItem)
].join('|');

const isSeedCase = (caseItem) => CASE_SEED.some((seed) => seed.id === caseItem?.id);

const getFallbackCaseId = (caseItem) => {
  const titleKey = String(caseItem?.title || 'case').trim() || 'case';
  const dateKey = getCaseDateKey(caseItem) || 'undated';
  return `case-${dateKey}-${encodeURIComponent(titleKey)}`;
};

const ensureCaseId = (caseItem) => ({
  ...caseItem,
  id: String(caseItem?.id || getFallbackCaseId(caseItem))
});

const dedupeCasesByTitleAndDate = (cases = []) => {
  const deduped = new Map();
  cases.filter(Boolean).map(ensureCaseId).forEach((caseItem) => {
    const key = getCaseDuplicateKey(caseItem);
    if (!key || key === '|') return;

    const existing = deduped.get(key);
    if (!existing) {
      deduped.set(key, caseItem);
      return;
    }

    const existingUpdatedAt = new Date(existing.updatedAt || existing.createdAt || 0).getTime();
    const itemUpdatedAt = new Date(caseItem.updatedAt || caseItem.createdAt || 0).getTime();
    if ((isSeedCase(existing) && !isSeedCase(caseItem)) || itemUpdatedAt > existingUpdatedAt) {
      deduped.set(key, caseItem);
    }
  });
  return Array.from(deduped.values());
};

const sortCasesByCreatedAt = (cases = []) => [...cases].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

const readLocalStorageCases = () => {
  if (typeof localStorage === 'undefined') return null;
  try {
    const saved = localStorage.getItem(CASE_STORAGE_KEY);
    if (!saved) return null;
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : null;
  } catch (error) {
    console.warn('localStorage 시공사례를 읽지 못했습니다.', error);
    return null;
  }
};

const writeLocalStorageCases = (cases) => {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(CASE_STORAGE_KEY, JSON.stringify(dedupeCasesByTitleAndDate(cases)));
  } catch (error) {
    console.warn('localStorage 시공사례를 저장하지 못했습니다.', error);
  }
};

let storageMigrationPromise;
const getPublishedCases = async () => {
  const localCases = readLocalStorageCases();
  if (localCases) return dedupeCasesByTitleAndDate(localCases);

  if (!storageMigrationPromise) {
    storageMigrationPromise = (async () => {
      const legacyCases = dedupeCasesByTitleAndDate(await getLegacyIndexedDbCases());
      if (legacyCases.length > 0) writeLocalStorageCases(legacyCases);
      return legacyCases;
    })();
  }
  return storageMigrationPromise;
};

const getCombinedCases = async () => {
  const seedIds = new Set(CASE_SEED.map((caseItem) => String(caseItem.id)));
  const seedDuplicateKeys = new Set(CASE_SEED.map(getCaseDuplicateKey));
  const publishedCases = (await getPublishedCases()).filter((caseItem) => (
    !seedIds.has(String(caseItem?.id)) && !seedDuplicateKeys.has(getCaseDuplicateKey(caseItem))
  ));
  return dedupeCasesByTitleAndDate([...CASE_SEED, ...publishedCases]);
};

const getAllCases = async () => sortCasesByCreatedAt(await getCombinedCases());

const getCaseById = async (id) => {
  const normalizedId = String(id || '');
  if (!normalizedId) return null;

  return (await getCombinedCases()).find((caseItem) => String(caseItem.id) === normalizedId) || null;
};

const saveCase = async (caseItem) => {
  const publishedCases = await getPublishedCases();
  const nextCases = dedupeCasesByTitleAndDate([
    ...publishedCases.filter((item) => item.id !== caseItem.id),
    caseItem
  ]);
  writeLocalStorageCases(nextCases);
};

const deleteCaseById = async (id) => {
  const publishedCases = await getPublishedCases();
  writeLocalStorageCases(publishedCases.filter((item) => item.id !== id));
};

const escapeHtml = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const formatDate = (dateString) => {
  const date = new Date(dateString || '');
  if (Number.isNaN(date.getTime())) return '날짜 미정';
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
};

const getCoverImage = (caseItem) => {
  const images = (Array.isArray(caseItem?.images) ? caseItem.images : [])
    .filter((image) => image && typeof image === 'object' && image.dataUrl);
  if (!images.length) return null;
  return images.find((image) => image.id === caseItem.coverImageId) || images[0];
};

const getYoutubeEmbedUrl = (url = '') => {
  const trimmed = url.trim();
  if (!trimmed) return '';
  const patterns = [
    /youtu\.be\/([\w-]{6,})/,
    /youtube\.com\/watch\?v=([\w-]{6,})/,
    /youtube\.com\/shorts\/([\w-]{6,})/,
    /youtube\.com\/embed\/([\w-]{6,})/
  ];
  const match = patterns.map((pattern) => trimmed.match(pattern)).find(Boolean);
  return match ? `https://www.youtube.com/embed/${match[1]}` : '';
};

const filesToMedia = async (files) => Promise.all(Array.from(files || []).map((file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve({
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    name: file.name,
    dataUrl: reader.result,
    type: file.type
  });
  reader.onerror = () => reject(reader.error);
  reader.readAsDataURL(file);
})));

const normalizeCase = (caseItem) => ({
  ...caseItem,
  title: caseItem.title?.trim() || '제목 없는 시공사례',
  category: CASE_CATEGORIES.includes(caseItem.category) ? caseItem.category : '기타',
  customerRequest: caseItem.customerRequest?.trim() || '',
  siteCondition: caseItem.siteCondition?.trim() || '',
  constructionPoint: caseItem.constructionPoint?.trim() || '',
  processes: Array.isArray(caseItem.processes) ? caseItem.processes : [],
  body: caseItem.body?.trim() || '',
  contentBlocks: Array.isArray(caseItem.contentBlocks) ? caseItem.contentBlocks : [],
  images: Array.isArray(caseItem.images) ? caseItem.images : [],
  video: caseItem.video || { type: 'youtube', url: '' },
  createdAt: caseItem.createdAt || new Date().toISOString(),
  updatedAt: new Date().toISOString()
});

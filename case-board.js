const CASE_DB_NAME = 'bandibuliConstructionCases';
const CASE_DB_VERSION = 1;
const CASE_STORE_NAME = 'cases';
const CASE_CATEGORIES = ['신축 아파트', '구축 올수리', '새가구 반입', '인테리어 후 냄새', '아이 있는 집', '대형시설', '기타'];
const CASE_PROCESSES = ['현장 점검', '유해물질 제거제', '차폐 공정', '오존 산화', '공기정화', '사후 환기 안내'];

const CASE_SEED = [
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

const withCaseStore = async (mode, action) => {
  const db = await openCaseDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(CASE_STORE_NAME, mode);
    const store = transaction.objectStore(CASE_STORE_NAME);
    const result = action(store);
    transaction.oncomplete = () => {
      db.close();
      resolve(result);
    };
    transaction.onerror = () => {
      db.close();
      reject(transaction.error);
    };
  });
};

const requestToPromise = (request) => new Promise((resolve, reject) => {
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});

const getAllCases = async () => {
  await seedCasesIfEmpty();
  const db = await openCaseDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(CASE_STORE_NAME, 'readonly');
    const request = transaction.objectStore(CASE_STORE_NAME).getAll();
    request.onsuccess = () => {
      db.close();
      resolve(request.result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
};

const getCaseById = async (id) => {
  await seedCasesIfEmpty();
  const db = await openCaseDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(CASE_STORE_NAME, 'readonly');
    const request = transaction.objectStore(CASE_STORE_NAME).get(id);
    request.onsuccess = () => {
      db.close();
      resolve(request.result || null);
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
};

const saveCase = async (caseItem) => withCaseStore('readwrite', (store) => store.put(caseItem));
const deleteCaseById = async (id) => withCaseStore('readwrite', (store) => store.delete(id));

let seedPromise;
const seedCasesIfEmpty = async () => {
  if (seedPromise) return seedPromise;
  seedPromise = (async () => {
    const db = await openCaseDb();
    const count = await new Promise((resolve, reject) => {
      const transaction = db.transaction(CASE_STORE_NAME, 'readonly');
      const request = transaction.objectStore(CASE_STORE_NAME).count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    db.close();
    if (count === 0) {
      await withCaseStore('readwrite', (store) => CASE_SEED.forEach((item) => store.put(item)));
    }
  })();
  return seedPromise;
};

const escapeHtml = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const formatDate = (dateString) => new Intl.DateTimeFormat('ko-KR', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
}).format(new Date(dateString));

const getCoverImage = (caseItem) => {
  if (!caseItem?.images?.length) return null;
  return caseItem.images.find((image) => image.id === caseItem.coverImageId) || caseItem.images[0];
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
  images: Array.isArray(caseItem.images) ? caseItem.images : [],
  video: caseItem.video || { type: 'youtube', url: '' },
  createdAt: caseItem.createdAt || new Date().toISOString(),
  updatedAt: new Date().toISOString()
});

const REVIEW_SITE_TYPES = ['신축 아파트', '구축 올수리', '새가구 반입', '인테리어 후 냄새', '대형시설', '기타'];
const REVIEW_ALLOWED_TYPES = new Map([
  ['image/jpeg', { extension: 'jpg', maxBytes: 5 * 1024 * 1024 }],
  ['image/png', { extension: 'png', maxBytes: 5 * 1024 * 1024 }],
  ['image/webp', { extension: 'webp', maxBytes: 5 * 1024 * 1024 }],
  ['image/gif', { extension: 'gif', maxBytes: 10 * 1024 * 1024 }]
]);
const REVIEW_COOLDOWN_KEY = 'bandibuliReviewLastSubmittedAt';

const getReviewConfig = () => window.BANDIBULI_SUPABASE || {};

const getClient = () => {
  const config = getReviewConfig();
  if (!window.supabase || !config.url || !config.anonKey || config.url.includes('YOUR_PROJECT_REF')) {
    throw new Error('Supabase URL과 anon key를 supabase-config.js에 설정해주세요.');
  }
  return window.supabase.createClient(config.url, config.anonKey);
};

const createConfirmToken = () => {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
};

const createReviewId = () => {
  if (crypto.randomUUID) return crypto.randomUUID();
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};

const validateReviewImage = (file) => {
  if (!file) return null;
  const rule = REVIEW_ALLOWED_TYPES.get(file.type);
  if (!rule) return 'jpg, jpeg, png, webp, gif 파일만 업로드할 수 있습니다.';
  if (file.size > rule.maxBytes) return file.type === 'image/gif' ? 'GIF는 10MB 이하만 업로드할 수 있습니다.' : '이미지는 5MB 이하만 업로드할 수 있습니다.';
  return null;
};

const createSafeImagePath = (file, token) => {
  const rule = REVIEW_ALLOWED_TYPES.get(file.type);
  const randomPart = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `public/${token.slice(0, 12)}-${randomPart}.${rule.extension}`;
};

const isCoolingDown = () => {
  const cooldownMs = Number(getReviewConfig().reviewSubmitCooldownMs || 60000);
  const lastSubmittedAt = Number(localStorage.getItem(REVIEW_COOLDOWN_KEY) || 0);
  return Date.now() - lastSubmittedAt < cooldownMs;
};

const setError = (message) => {
  const errorNode = document.querySelector('[data-review-submit-error]');
  if (errorNode) errorNode.textContent = message;
};

const uploadReviewImage = async (client, file, token) => {
  if (!file) return '';
  const bucket = getReviewConfig().reviewImageBucket || 'review-images';
  const path = createSafeImagePath(file, token);
  const { error } = await client.storage.from(bucket).upload(path, file, {
    cacheControl: '31536000',
    contentType: file.type,
    upsert: false
  });
  if (error) throw error;
  const { data } = client.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
};

const validateForm = (form, file) => {
  const formData = new FormData(form);
  const nickname = String(formData.get('nickname') || '').trim();
  const siteType = String(formData.get('site_type') || '').trim();
  const rating = Number(formData.get('rating'));
  const reviewText = String(formData.get('review_text') || '').trim();
  const minLength = Number(getReviewConfig().reviewMinLength || 20);
  if (!nickname) return '닉네임을 입력해주세요.';
  if (!REVIEW_SITE_TYPES.includes(siteType)) return '현장 유형을 선택해주세요.';
  if (!rating || rating < 1 || rating > 5) return '별점을 선택해주세요.';
  if (reviewText.length < minLength) return `리뷰 내용은 ${minLength}자 이상 입력해주세요.`;
  if (!formData.get('consent_agreed')) return '필독 안내 확인 및 동의가 필요합니다.';
  if (isCoolingDown()) return '짧은 시간 안에 반복 제출할 수 없습니다. 잠시 후 다시 시도해주세요.';
  return validateReviewImage(file);
};

const initPreview = () => {
  const input = document.querySelector('input[name="review_image"]');
  const preview = document.querySelector('[data-image-preview]');
  if (!input || !preview) return;
  input.addEventListener('change', () => {
    const [file] = input.files || [];
    const error = validateReviewImage(file);
    if (error) {
      setError(error);
      input.value = '';
      preview.innerHTML = '';
      return;
    }
    setError('');
    if (!file) {
      preview.innerHTML = '';
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    preview.innerHTML = `<div class="admin-media-item"><img src="${previewUrl}" alt="업로드 이미지 미리보기" /><strong>${file.name}</strong></div>`;
  });
};

const initSubmit = () => {
  const form = document.querySelector('[data-review-submit-form]');
  if (!form) return;
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    setError('');
    const [file] = form.elements.review_image.files || [];
    const validationError = validateForm(form, file);
    if (validationError) {
      setError(validationError);
      return;
    }
    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = '접수 중...';
    try {
      const client = getClient();
      const formData = new FormData(form);
      const reviewId = createReviewId();
      const token = createConfirmToken();
      const imageUrl = await uploadReviewImage(client, file, token);
      const payload = {
        id: reviewId,
        nickname: String(formData.get('nickname')).trim(),
        site_type: String(formData.get('site_type')).trim(),
        rating: Number(formData.get('rating')),
        review_text: String(formData.get('review_text')).trim(),
        image_url: imageUrl,
        status: 'pending',
        confirm_token: token,
        consent_agreed: true
      };
      const { error } = await client.from('reviews').insert(payload);
      if (error) throw error;
      localStorage.setItem(REVIEW_COOLDOWN_KEY, String(Date.now()));
      window.location.href = `review-confirm.html?id=${encodeURIComponent(reviewId)}&token=${encodeURIComponent(token)}`;
    } catch (error) {
      console.error(error);
      setError(error.message || '후기 접수 중 오류가 발생했습니다.');
      submitButton.disabled = false;
      submitButton.textContent = '후기 제출하기';
    }
  });
};

initPreview();
initSubmit();

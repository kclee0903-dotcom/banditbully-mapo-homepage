(() => {
  const DEFAULT_TIMEOUT_MS = 8000;

  const getConfig = () => window.BANDIBULI_SUPABASE || {};

  const getTimeoutMs = () => {
    const configured = Number(getConfig().reviewRequestTimeoutMs);
    return Number.isFinite(configured) && configured >= 3000 ? configured : DEFAULT_TIMEOUT_MS;
  };

  const createTimedFetch = (timeoutMs = getTimeoutMs()) => async (input, init = {}) => {
    const controller = new AbortController();
    const upstreamSignal = init.signal;
    const abortFromUpstream = () => controller.abort(upstreamSignal?.reason);

    if (upstreamSignal?.aborted) {
      abortFromUpstream();
    } else {
      upstreamSignal?.addEventListener('abort', abortFromUpstream, { once: true });
    }

    const timeoutId = window.setTimeout(() => {
      controller.abort(new DOMException('Supabase request timed out', 'TimeoutError'));
    }, timeoutMs);

    try {
      return await window.fetch(input, { ...init, signal: controller.signal });
    } finally {
      window.clearTimeout(timeoutId);
      upstreamSignal?.removeEventListener('abort', abortFromUpstream);
    }
  };

  const createClient = ({ headers = {}, timeoutMs = getTimeoutMs() } = {}) => {
    const config = getConfig();
    if (!window.supabase) {
      throw new Error('Supabase 라이브러리를 불러오지 못했습니다. 잠시 후 새로고침해주세요.');
    }
    if (!config.url || !config.anonKey || config.url.includes('YOUR_PROJECT_REF')) {
      throw new Error('Supabase 연결 주소와 공개 키가 설정되지 않았습니다.');
    }

    return window.supabase.createClient(config.url, config.anonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      },
      global: {
        fetch: createTimedFetch(timeoutMs),
        headers
      }
    });
  };

  const getErrorDetails = (error = {}) => ({
    code: String(error.code || error.statusCode || error.status || '').trim(),
    message: String(error.message || error.error_description || error.details || error || '').trim()
  });

  const isNetworkError = (error, message) => {
    const name = String(error?.name || '').toLowerCase();
    const normalized = message.toLowerCase();
    return name.includes('abort')
      || name.includes('timeout')
      || normalized.includes('failed to fetch')
      || normalized.includes('networkerror')
      || normalized.includes('network request failed')
      || normalized.includes('load failed')
      || normalized.includes('timed out')
      || normalized.includes('timeout')
      || normalized.includes('aborted');
  };

  const createStageError = (stage, error) => {
    if (error?.reviewStage) return error;

    const { code, message } = getErrorDetails(error);
    const normalized = message.toLowerCase();
    let guidance = message || '알 수 없는 오류가 발생했습니다.';

    if (isNetworkError(error, message)) {
      guidance = 'Supabase 서버에 연결할 수 없습니다. 프로젝트 일시 중지 여부와 연결 주소를 확인해주세요.';
    } else if (code === '401' || normalized.includes('invalid api key') || normalized.includes('invalid jwt')) {
      guidance = 'Supabase 공개 키가 올바르지 않거나 비활성화되었습니다.';
    } else if (
      code === '403'
      || code === '42501'
      || normalized.includes('row-level security')
      || normalized.includes('permission denied')
      || normalized.includes('not authorized')
    ) {
      guidance = stage === '이미지 업로드'
        ? 'review-images 버킷의 Storage INSERT·SELECT RLS 정책을 확인해주세요.'
        : 'reviews 테이블의 SELECT·INSERT 권한과 RLS 정책을 확인해주세요.';
    } else if (
      code === '404'
      || code === '42P01'
      || code === 'PGRST205'
      || normalized.includes('bucket not found')
      || normalized.includes('could not find the table')
    ) {
      guidance = stage === '이미지 업로드'
        ? 'review-images Storage 버킷을 찾을 수 없습니다.'
        : 'public.reviews 테이블을 찾을 수 없습니다.';
    }

    const suffix = code && !guidance.includes(`(${code})`) ? ` (${code})` : '';
    const wrapped = new Error(`${stage} 실패: ${guidance}${suffix}`);
    wrapped.reviewStage = stage;
    wrapped.originalError = error;
    return wrapped;
  };

  window.BANDIBULI_SUPABASE_HELPERS = {
    createClient,
    createStageError,
    getConfig,
    getTimeoutMs
  };
})();

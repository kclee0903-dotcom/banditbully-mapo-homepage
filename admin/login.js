const getAdminLoginClient = () => {
  const config = window.BANDIBULI_SUPABASE || {};
  if (!window.supabase || !config.url || !config.anonKey || config.url.includes('YOUR_PROJECT_REF')) {
    throw new Error('Supabase URL과 anon key를 supabase-config.js에 설정해주세요.');
  }
  return window.supabase.createClient(config.url, config.anonKey);
};

const initAdminLogin = async () => {
  const form = document.querySelector('[data-admin-login-form]');
  const errorNode = document.querySelector('[data-admin-login-error]');
  if (!form) return;
  const client = getAdminLoginClient();
  const { data: { session } } = await client.auth.getSession();
  if (session) window.location.href = 'reviews.html';
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    errorNode.textContent = '';
    const formData = new FormData(form);
    const { error } = await client.auth.signInWithPassword({
      email: String(formData.get('email') || '').trim(),
      password: String(formData.get('password') || '')
    });
    if (error) {
      errorNode.textContent = '아이디 또는 비밀번호를 확인해주세요.';
      return;
    }
    window.location.href = 'reviews.html';
  });
};

initAdminLogin().catch((error) => {
  console.error(error);
  const errorNode = document.querySelector('[data-admin-login-error]');
  if (errorNode) errorNode.textContent = error.message || '로그인 설정을 확인해주세요.';
});

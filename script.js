const header = document.querySelector('[data-header]');
const form = document.querySelector('.contact-form');
const formNote = document.querySelector('[data-form-note]');

const updateHeader = () => {
  header?.classList.toggle('is-scrolled', window.scrollY > 8);
};

window.addEventListener('scroll', updateHeader, { passive: true });
updateHeader();

form?.addEventListener('submit', (event) => {
  event.preventDefault();

  const formData = new FormData(form);
  const name = String(formData.get('name') || '').trim();
  const phone = String(formData.get('phone') || '').trim();

  if (!name || !phone) {
    formNote.textContent = '이름과 연락처를 입력해 주세요.';
    formNote.classList.add('is-error');
    return;
  }

  formNote.textContent = '문의가 준비되었습니다. 입력하신 연락처로 상담을 도와드리겠습니다.';
  formNote.classList.remove('is-error');
  form.reset();
});

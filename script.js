const header = document.querySelector('[data-header]');

const updateHeader = () => {
  header?.classList.toggle('is-scrolled', window.scrollY > 8);
};

window.addEventListener('scroll', updateHeader, { passive: true });
updateHeader();

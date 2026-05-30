const header = document.querySelector('[data-header]');
const topButton = document.querySelector('[data-top-button]');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

const updateHeader = () => {
  header?.classList.toggle('is-scrolled', window.scrollY > 8);
};

const updateTopButton = () => {
  if (!topButton) return;

  const isVisible = window.scrollY > 180;
  topButton.classList.toggle('is-visible', isVisible);
  topButton.setAttribute('aria-hidden', String(!isVisible));
  topButton.tabIndex = isVisible ? 0 : -1;
};

window.addEventListener('scroll', () => {
  updateHeader();
  updateTopButton();
}, { passive: true });

topButton?.addEventListener('click', () => {
  window.scrollTo({
    top: 0,
    behavior: prefersReducedMotion.matches ? 'auto' : 'smooth',
  });
});

updateHeader();
updateTopButton();

const revealSelectors = ['.reveal', '.reveal-card', '.reveal-table', '.reveal-image'];
const revealItems = new Set(document.querySelectorAll(revealSelectors.join(', ')));

const rhythmGroups = document.querySelectorAll('.cards, .premium-brand__cards, .intent-grid, .timeline, .faq-list, .contact-card__actions');

rhythmGroups.forEach((group) => {
  Array.from(group.children).forEach((item, index) => {
    if (!item.matches(revealSelectors.join(', '))) {
      item.classList.add('reveal-card');
    }

    if (!item.style.getPropertyValue('--reveal-delay')) {
      item.style.setProperty('--reveal-delay', `${Math.min(index * 0.16, 0.48)}s`);
    }

    revealItems.add(item);
  });
});

if (revealItems.size) {
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        entry.target.classList.toggle('is-visible', entry.isIntersecting);
      });
    }, {
      threshold: 0.2,
      rootMargin: '0px 0px -10% 0px',
    });

    revealItems.forEach((item) => revealObserver.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  }
}

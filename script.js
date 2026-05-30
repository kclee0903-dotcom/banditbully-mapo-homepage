const header = document.querySelector('[data-header]');

const updateHeader = () => {
  header?.classList.toggle('is-scrolled', window.scrollY > 8);
};

window.addEventListener('scroll', updateHeader, { passive: true });
updateHeader();

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

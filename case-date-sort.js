const caseGrid = document.querySelector('.case-grid');

if (caseGrid) {
  const caseCards = Array.from(caseGrid.children);

  caseCards
    .map((card, index) => {
      const featured = card.dataset.featured === 'true' ? 1 : 0;
      const dateValue = card.querySelector('time[datetime]')?.dateTime || '';
      const timestamp = dateValue ? Date.parse(`${dateValue}T00:00:00`) : Number.NEGATIVE_INFINITY;
      return { card, featured, index, timestamp: Number.isNaN(timestamp) ? Number.NEGATIVE_INFINITY : timestamp };
    })
    .sort((a, b) => b.featured - a.featured || b.timestamp - a.timestamp || a.index - b.index)
    .forEach(({ card }) => caseGrid.appendChild(card));
}

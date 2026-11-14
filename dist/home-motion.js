const interactiveHomeItems = '.hero-actions .btn, .mode-card';

document.addEventListener('pointermove', (event) => {
  if (event.pointerType !== 'mouse') return;
  const item = event.target.closest(interactiveHomeItems);
  if (!item) return;

  const bounds = item.getBoundingClientRect();
  const x = ((event.clientX - bounds.left) / bounds.width) * 100;
  const y = ((event.clientY - bounds.top) / bounds.height) * 100;
  item.style.setProperty('--pointer-x', `${x}%`);
  item.style.setProperty('--pointer-y', `${y}%`);
});

document.addEventListener('pointerout', (event) => {
  const item = event.target.closest(interactiveHomeItems);
  if (!item || item.contains(event.relatedTarget)) return;
  item.style.removeProperty('--pointer-x');
  item.style.removeProperty('--pointer-y');
});

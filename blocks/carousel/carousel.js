/**
 * Carousel block
 * Each row is a slide. First cell = image, second cell = overlay content
 * (heading, text, CTA). Generates slide track, nav dots and prev/next controls.
 * No autoplay; keyboard and ARIA accessible.
 * @param {Element} block
 */
export default function decorate(block) {
  const rows = [...block.children];
  const slides = rows.map((row, i) => {
    row.classList.add('carousel-slide');
    row.setAttribute('role', 'group');
    row.setAttribute('aria-roledescription', 'slide');
    row.setAttribute('aria-label', `Slide ${i + 1} of ${rows.length}`);
    if (i !== 0) row.setAttribute('aria-hidden', 'true');

    // classify cells: picture cell vs content cell
    [...row.children].forEach((cell) => {
      if (cell.querySelector('picture')) cell.classList.add('carousel-slide-image');
      else cell.classList.add('carousel-slide-content');
    });
    return row;
  });

  if (slides.length <= 1) return; // nothing to rotate

  // track wrapper
  const track = document.createElement('div');
  track.className = 'carousel-track';
  slides.forEach((s) => track.append(s));

  const dots = document.createElement('div');
  dots.className = 'carousel-dots';
  dots.setAttribute('role', 'tablist');

  let current = 0;
  const goTo = (index) => {
    current = (index + slides.length) % slides.length;
    track.style.transform = `translateX(-${current * 100}%)`;
    slides.forEach((s, i) => s.setAttribute('aria-hidden', i === current ? 'false' : 'true'));
    dots.querySelectorAll('.carousel-dot').forEach((d, i) => {
      if (i === current) d.setAttribute('aria-selected', 'true');
      else d.removeAttribute('aria-selected');
    });
  };

  // dots
  slides.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'carousel-dot';
    dot.setAttribute('role', 'tab');
    dot.setAttribute('aria-label', `Show slide ${i + 1}`);
    if (i === 0) dot.setAttribute('aria-selected', 'true');
    dot.addEventListener('click', () => goTo(i));
    dots.append(dot);
  });

  // prev/next controls
  const controls = document.createElement('div');
  controls.className = 'carousel-controls';
  const prev = document.createElement('button');
  prev.type = 'button';
  prev.className = 'carousel-prev';
  prev.setAttribute('aria-label', 'Previous slide');
  const next = document.createElement('button');
  next.type = 'button';
  next.className = 'carousel-next';
  next.setAttribute('aria-label', 'Next slide');
  controls.append(prev, next);

  prev.addEventListener('click', () => goTo(current - 1));
  next.addEventListener('click', () => goTo(current + 1));

  block.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { goTo(current - 1); prev.focus(); }
    if (e.key === 'ArrowRight') { goTo(current + 1); next.focus(); }
  });

  block.textContent = '';
  block.append(track, dots, controls);
}

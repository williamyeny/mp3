const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

const SPECS = [
  ['released', 'Released'],
  ['screen', 'Screen'],
  ['battery', 'Battery'],
  ['port', 'Port'],
  ['formats', 'Formats'],
  ['fm', 'FM radio'],
  ['software', 'Software'],
  ['firmware', 'Firmware'],
  ['size', 'Size (mm)'],
  ['weight', 'Weight'],
];

const bySlug = Object.fromEntries(SERIES.map((s) => [s.slug, s]));
const src = (s, img) => `images/${s.slug}/${img.file}`;
const title = (s) => `${s.name} series` + (s.nickname ? ` (${s.nickname})` : '');
const credit = (img) =>
  img.source ? `<a href="${esc(img.source)}" rel="noopener">${esc(img.credit)}</a>` : esc(img.credit);
const captionHtml = (img) => `${esc(img.caption)} <span class="credit">${credit(img)}</span>`;

// Gallery view: one post per series, newest first
document.getElementById('gallery-view').innerHTML = SERIES.map((s) => `
  <article class="post" id="${s.slug}">
    <header>
      <h2>${esc(title(s))}</h2>
      <p class="meta">${esc(s.released)}${s.region ? ' · ' + esc(s.region) : ''} · ${s.models.map(([m, cap]) => `${esc(m)} <span class="cap">${esc(cap)}</span>`).join(', ')}</p>
    </header>
    ${s.images.length ? `
    <div class="carousel" data-series="${s.slug}">
      <div class="slides">
        ${s.images.map((img, i) => `
          <button type="button" class="slide" data-i="${i}" aria-label="Open photo ${i + 1}">
            <img src="${esc(src(s, img))}" alt="${esc(img.caption)}" loading="lazy">
          </button>`).join('')}
      </div>
      ${s.images.length > 1 ? `
        <span class="count">1/${s.images.length}</span>
        <button type="button" class="nav prev" data-step="-1" aria-label="Previous photo">&lsaquo;</button>
        <button type="button" class="nav next" data-step="1" aria-label="Next photo">&rsaquo;</button>
        <div class="dots">${s.images.map((_, i) => `<span${i ? '' : ' class="on"'}></span>`).join('')}</div>` : ''}
    </div>
    <p class="caption">${captionHtml(s.images[0])}</p>` : ''}
    ${s.notes ? `<p class="notes">${esc(s.notes)}</p>` : ''}
    ${s.colors.length ? `<p class="colors">Colors: ${esc(s.colors.join(', '))}</p>` : ''}
    <details>
      <summary>Specs</summary>
      <dl class="specs">
        <dt>Models</dt><dd>${s.models.map(([m, cap]) => `${esc(m)} (${esc(cap)})`).join(', ')}</dd>
        ${SPECS.filter(([k]) => s[k]).map(([k, label]) => `<dt>${label}</dt><dd>${esc(s[k])}</dd>`).join('')}
      </dl>
    </details>
  </article>`).join('');

// Table view
document.getElementById('rows').innerHTML = SERIES.map((s) => `
  <tr>
    <th>
      ${s.images.length ? `<button type="button" class="thumb" data-series="${s.slug}" aria-label="Photos of the ${esc(s.name)} series">
        <img src="${esc(src(s, s.images[0]))}" alt="" loading="lazy">
      </button>` : ''}
      <a href="#${s.slug}">${esc(s.name)}</a>
    </th>
    <td>${esc(s.released)}${s.region ? `<br><small>${esc(s.region)}</small>` : ''}</td>
    <td class="models">${s.models.map(([m, cap]) => `<span>${esc(m)} <small>${esc(cap)}</small></span>`).join('')}</td>
    ${SPECS.slice(1).map(([k]) => `<td>${esc(s[k] || '—')}</td>`).join('')}
  </tr>`).join('');

// Carousels: keep the counter, dots and caption in sync with the swiped-to photo
document.querySelectorAll('.carousel').forEach((c) => {
  const s = bySlug[c.dataset.series];
  const slides = c.querySelector('.slides');
  const post = c.closest('.post');
  let shown = 0;
  slides.addEventListener('scroll', () => {
    const i = Math.round(slides.scrollLeft / slides.clientWidth);
    if (i === shown || !s.images[i]) return;
    shown = i;
    c.querySelector('.count').textContent = `${i + 1}/${s.images.length}`;
    c.querySelectorAll('.dots span').forEach((d, j) => d.classList.toggle('on', j === i));
    post.querySelector('.caption').innerHTML = captionHtml(s.images[i]);
  }, { passive: true });
  c.addEventListener('click', (e) => {
    const nav = e.target.closest('.nav');
    if (nav) slides.scrollBy({ left: Number(nav.dataset.step) * slides.clientWidth, behavior: 'smooth' });
    const slide = e.target.closest('.slide');
    if (slide) openViewer(s, Number(slide.dataset.i));
  });
});

document.getElementById('rows').addEventListener('click', (e) => {
  const thumb = e.target.closest('.thumb');
  if (thumb) openViewer(bySlug[thumb.dataset.series], 0);
});

// Full-screen photo viewer
const viewer = document.getElementById('viewer');
const viewerImg = viewer.querySelector('img');
const viewerText = viewer.querySelector('p');
let current = null;
let index = 0;

function show(i) {
  index = (i + current.images.length) % current.images.length;
  const img = current.images[index];
  viewerImg.src = src(current, img);
  viewerImg.alt = img.caption;
  viewerText.innerHTML = `${esc(title(current))}: ${esc(img.caption)} (${index + 1}/${current.images.length})<br><span class="credit">${credit(img)}</span>`;
}

function openViewer(s, i) {
  current = s;
  show(i);
  viewer.showModal();
}

viewer.addEventListener('click', (e) => {
  if (e.target.dataset.step) show(index + Number(e.target.dataset.step));
  else if (e.target.hasAttribute('data-close') || e.target === viewer || e.target.classList.contains('viewer-img')) viewer.close();
});

document.addEventListener('keydown', (e) => {
  if (!viewer.open) return;
  if (e.key === 'ArrowLeft') show(index - 1);
  if (e.key === 'ArrowRight') show(index + 1);
});

let touchX = null;
viewer.addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; }, { passive: true });
viewer.addEventListener('touchend', (e) => {
  const dx = e.changedTouches[0].clientX - touchX;
  if (Math.abs(dx) > 50) show(index + (dx < 0 ? 1 : -1));
});

// Views: gallery by default, table at #table, #<slug> jumps to a post in the gallery
function route() {
  const hash = location.hash.slice(1);
  const table = hash === 'table';
  document.getElementById('gallery-view').hidden = table;
  document.getElementById('table-view').hidden = !table;
  document.body.classList.toggle('wide', table);
  document.querySelectorAll('.views a').forEach((a) => {
    if ((a.dataset.view === 'table') === table) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
  if (bySlug[hash]) document.getElementById(hash).scrollIntoView();
}
window.addEventListener('hashchange', route);
route();

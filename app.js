'use strict';
const c = window.CONTENT;
const el = (tag, className, text) => { const node = document.createElement(tag); if (className) node.className = className; if (text) node.textContent = text; return node; };
const webUrl = value => { try { const u = new URL(value); return ['https:', 'http:'].includes(u.protocol) ? u.href : null; } catch { return null; } };
document.querySelectorAll('[data-text]').forEach(node => { node.textContent = c[node.dataset.text] || ''; });
document.title = c.brand;
const cover = document.querySelector('#cover'); cover.src = c.cover.image; cover.alt = c.cover.alt;
for (const social of c.socials) { const url = webUrl(social.url); const node = el(url ? 'a' : 'span', 'tag', social.label + (url ? ' ↗' : '・' + c.labels.preparing)); if (url) { node.href = url; node.target = '_blank'; node.rel = 'noopener noreferrer'; } document.querySelector('#socials').append(node); }
async function availableFile(path) {
  if (!path) return null;
  try { const url = new URL(path, location.href); if (url.origin !== location.origin || !url.pathname.startsWith(new URL('assets/', location.href).pathname)) return null; const response = await fetch(url, { method: 'HEAD' }); return response.ok ? url.href : null; } catch { return null; }
}
for (const category of c.collections) {
  const section = el('section', 'category'); section.id = category.id;
  const heading = el('div', 'category-heading'); heading.append(el('h3', '', category.title), el('span', '', category.subtitle)); section.append(heading);
  const cards = el('div', 'cards'); section.append(cards);
  for (const item of category.items) {
    const article = el('article', 'card'); const preview = el('div', 'preview ' + (category.id === 'wallpapers' ? 'wallpaper' : category.id === 'stickers' ? 'sticker' : ''));
    const img = el('img'); img.src = item.image || 'assets/placeholder.svg'; img.alt = item.alt || item.title; img.loading = 'lazy'; img.addEventListener('error', () => { if (!img.src.endsWith('/placeholder.svg')) img.src = 'assets/placeholder.svg'; });
    preview.append(img); if (!item.image || item.image.includes('placeholder.svg')) preview.append(el('span', 'badge', c.labels.placeholder));
    const info = el('div', 'card-info'); const words = el('div'); words.append(el('h4', '', item.title), el('p', '', item.description)); const action = el('span', 'card-action pending', c.labels.preparing); info.append(words, action); article.append(preview, info); cards.append(article);
    if (category.id === 'stickers') { const url = webUrl(item.storeUrl); if (url) { const a = el('a', 'card-action', c.labels.store); a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer'; action.replaceWith(a); } }
    else availableFile(item.download).then(url => { if (url) { const a = el('a', 'card-action', c.labels.download); a.href = url; a.download = ''; action.replaceWith(a); } });
  }
  document.querySelector('#collections').append(section);
}
const emailArea = document.querySelector('#email');
if (typeof c.email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email) && !/[\r\n]/.test(c.email)) {
  emailArea.className = 'email-actions'; const mail = el('a', 'tag', c.email); mail.href = 'mailto:' + c.email;
  const copy = el('button', 'tag', c.labels.copy); copy.type = 'button'; copy.addEventListener('click', async () => { try { await navigator.clipboard.writeText(c.email); document.querySelector('#feedback').textContent = c.labels.copied; } catch { document.querySelector('#feedback').textContent = c.labels.copyFailed; } }); emailArea.append(mail, copy);
} else emailArea.append(el('span', 'tag pending', c.labels.emailPending));

// 自然捲動，不固定畫面；角色進入視窗時輕跳一次。
(async function setupCharacterStory() {
  const story = c.characterStory;
  const section = document.querySelector('#character-story');
  if (!story || !section) return;
  section.setAttribute('aria-label', story.label);
  section.textContent = story.pending;
  const stage = el('div', 'character-stage');
  const illustration = el('div', 'character-illustration');
  illustration.setAttribute('role', 'img');
  illustration.setAttribute('aria-label', story.alt);
  const layers = story.after.map(src => {
    const image = el('img', 'character-layer'); image.src = src; image.alt = '';
    illustration.append(image); return image;
  });
  stage.append(illustration, el('p', 'character-trait character-dog', story.dog),
    el('p', 'character-trait character-green', story.green));
  try { await Promise.all(layers.map(image => image.decode())); }
  catch { return; }
  section.replaceChildren(stage); section.classList.add('is-ready');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.intersectionRatio >= 0.4) {
        if (!reduced.matches) stage.classList.add('is-bouncing');
      } else if (!entry.isIntersecting) {
        stage.classList.remove('is-bouncing');
      }
    }
  }, { threshold: [0, 0.4] });
  observer.observe(stage);
  reduced.addEventListener('change', () => {
    if (reduced.matches) stage.classList.remove('is-bouncing');
  });
})();

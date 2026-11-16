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
  const isAvatar = category.id === 'avatars';
  const cards = el('div', isAvatar ? 'avatar-groups' : 'cards'); section.append(cards);
  const groupedCards = new Map();
  function addGroup(id, title) {
    const group = el('section', 'avatar-color-group');
    group.append(el('h4', 'color-heading', title));
    const grid = el('div', 'cards'); group.append(grid); cards.append(group);
    groupedCards.set(id, grid);
  }
  if (isAvatar) for (const group of category.colorGroups || []) {
    if (category.items.some(item => item.colorGroup === group.id)) addGroup(group.id, group.title);
  }
  for (const item of category.items) {
    const article = el('article', 'card'); const preview = el('div', 'preview ' + (category.id === 'wallpapers' ? 'wallpaper' : category.id === 'stickers' ? 'sticker' : ''));
    const img = el('img'); img.src = item.image || 'assets/placeholder.svg'; img.alt = item.alt || item.title; img.loading = 'lazy'; img.addEventListener('error', () => { if (!img.src.endsWith('/placeholder.svg')) img.src = 'assets/placeholder.svg'; });
    preview.append(img); if (!item.image || item.image.includes('placeholder.svg')) preview.append(el('span', 'badge', c.labels.placeholder));
    const info = el('div', 'card-info'); const words = el('div'); words.append(el(isAvatar ? 'h5' : 'h4', '', item.title), el('p', '', item.description)); const action = el('span', 'card-action pending', c.labels.preparing); info.append(words, action); article.append(preview, info);
    if (isAvatar) {
      if (!groupedCards.has(item.colorGroup)) addGroup(item.colorGroup, c.labels.otherColor);
      groupedCards.get(item.colorGroup).append(article);
    } else cards.append(article);
    if (category.id === 'stickers') { const url = webUrl(item.storeUrl); if (url) { const a = el('a', 'card-action', c.labels.store); a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer'; action.replaceWith(a); } }
    else availableFile(item.download).then(url => { if (url) { const a = el('a', 'card-action', isAvatar ? c.labels.avatarDownload : c.labels.download); a.href = url; a.download = ''; a.setAttribute('aria-label', '下載' + item.title); action.replaceWith(a); } });
  }
  document.querySelector('#collections').append(section);
}
const emailArea = document.querySelector('#email');
if (typeof c.email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email) && !/[\r\n]/.test(c.email)) {
  emailArea.className = 'email-actions'; const mail = el('a', 'tag', c.email); mail.href = 'mailto:' + c.email;
  const copy = el('button', 'tag', c.labels.copy); copy.type = 'button'; copy.addEventListener('click', async () => { try { await navigator.clipboard.writeText(c.email); document.querySelector('#feedback').textContent = c.labels.copied; } catch { document.querySelector('#feedback').textContent = c.labels.copyFailed; } }); emailArea.append(mail, copy);
} else emailArea.append(el('span', 'tag pending', c.labels.emailPending));

// 三張獨立角色卡片，從左至右交錯向上浮現，頁面維持自然捲動。
(async function setupCharacterStory() {
  const story = c.characterStory;
  const section = document.querySelector('#character-story');
  if (!story || !section) return;
  section.setAttribute('aria-label', story.label);
  section.textContent = story.pending;
  const stage = el('div', 'character-cards');
  const images = [];
  story.cards.forEach((item, index) => {
    const card = el('article', 'character-card');
    card.style.setProperty('--entry-delay', (index * 160) + 'ms');
    card.style.setProperty('--character-color', item.color);
    const portrait = el('div', 'character-portrait');
    const crop = el('div', 'character-crop');
    const [x, y, width, height] = item.crop;
    crop.style.aspectRatio = width + ' / ' + height;
    const image = el('img'); image.src = item.image; image.alt = item.name;
    image.style.width = (item.canvas[0] / width * 100) + '%';
    image.style.left = (-x / width * 100) + '%';
    image.style.top = (-y / height * 100) + '%';
    crop.append(image); portrait.append(crop); images.push(image);
    card.append(portrait, el('h3', 'character-name', item.name));
    if (item.description) card.append(el('p', 'character-description', item.description));
    stage.append(card);
  });
  try { await Promise.all(images.map(image => image.decode())); }
  catch { return; }
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  if (!reduced.matches && 'IntersectionObserver' in window) stage.classList.add('can-reveal');
  section.replaceChildren(stage); section.classList.add('is-ready');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        stage.classList.add('is-visible'); observer.disconnect();
      }
    }, { threshold: 0.3 });
    observer.observe(stage);
  }
  reduced.addEventListener('change', () => {
    if (reduced.matches) stage.classList.remove('can-reveal');
  });
})();

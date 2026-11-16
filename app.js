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
async function appendDownload(item, container, label, name) {
  const url = await availableFile(item.download);
  if (!url) return;
  container.querySelector('.pending')?.remove();
  const link = el('a', 'card-action', label);
  link.href = url;
  link.download = item.fileName || item.download.split('/').pop();
  link.setAttribute('aria-label', label.replace(' ↓', '') + '：' + name);
  container.append(link);
}
for (const category of c.collections) {
  const section = el('section', 'category'); section.id = category.id;
  const heading = el('div', 'category-heading'); heading.append(el('h3', '', category.title)); if (category.subtitle) heading.append(el('span', '', category.subtitle)); section.append(heading);
  const isAvatar = category.id === 'avatars';
  const isWallpaper = category.id === 'wallpapers';
  const isGrouped = isAvatar || isWallpaper;
  const cards = el('div', isAvatar ? 'avatar-groups' : isWallpaper ? 'wallpaper-groups' : 'cards'); section.append(cards);
  const groupedCards = new Map();
  function addGroup(id, title) {
    const group = el('section', isAvatar ? 'avatar-color-group' : 'wallpaper-layout-group');
    group.dataset.group = id;
    group.append(el('h4', 'color-heading', title));
    const grid = el('div', 'cards'); group.append(grid); cards.append(group);
    groupedCards.set(id, grid);
  }
  const groupKey = isAvatar ? 'colorGroup' : 'layoutGroup';
  if (isGrouped) for (const group of (isAvatar ? category.colorGroups : category.layoutGroups) || []) {
    if (category.items.some(item => item[groupKey] === group.id)) addGroup(group.id, group.title);
  }
  category.items.forEach(item => {
    const article = el('article', 'card');
    const preview = el('div', 'preview ' + (isWallpaper ? 'wallpaper' : category.id === 'stickers' ? 'sticker' : ''));
    if (category.id === 'stickers' && item.rowCount) {
      preview.classList.add('sticker-sheet');
      preview.setAttribute('role', 'img'); preview.setAttribute('aria-label', item.alt);
      for (let row = 0; row < item.rowCount; row++) {
        const strip = el('div', 'sticker-row');
        strip.style.aspectRatio = item.imageWidth + ' / ' + (item.imageHeight / item.rowCount);
        strip.setAttribute('aria-hidden', 'true');
        const image = el('img'); image.src = item.image; image.alt = ''; image.loading = 'lazy';
        image.style.top = (-row * 100) + '%'; strip.append(image); preview.append(strip);
      }
    } else {
      const img = el('img'); img.src = item.image || 'assets/placeholder.svg'; img.alt = item.alt || item.title; img.loading = 'lazy';
      img.addEventListener('error', () => { if (!img.src.endsWith('/placeholder.svg')) img.src = 'assets/placeholder.svg'; });
      preview.append(img); if (!item.image || item.image.includes('placeholder.svg')) preview.append(el('span', 'badge', c.labels.placeholder));
    }
    const info = el('div', 'card-info'); const words = el('div');
    words.append(el(isGrouped ? 'h5' : 'h4', '', item.title), el('p', '', item.description));
    const actions = el('div', 'card-actions'); actions.append(el('span', 'card-action pending', c.labels.preparing));
    info.append(words, actions); article.append(preview, info);
    if (isGrouped) {
      if (!groupedCards.has(item[groupKey])) addGroup(item[groupKey], c.labels.otherColor);
      const grid = groupedCards.get(item[groupKey]);
      if (isWallpaper) article.style.setProperty('--entry-delay', ((grid.children.length % 3) * 130) + 'ms');
      grid.append(article);
    } else cards.append(article);
    if (category.id === 'stickers') {
      const url = webUrl(item.storeUrl);
      if (url) {
        actions.querySelector('.pending').remove();
        const link = el('a', 'card-action store-button', c.labels.store); link.href = url; link.target = '_blank'; link.rel = 'noopener noreferrer'; actions.append(link);
      }
    }
    if (category.id !== 'stickers') appendDownload(item, actions, isAvatar ? c.labels.avatarDownload : c.labels.download, item.title);
  });
  document.querySelector('#collections').append(section);
}
// 每張桌布接近視窗才向上浮現，交錯延遲，不固定或攔截捲動。
const wallpaperMotion = matchMedia('(prefers-reduced-motion: reduce)');
const wallpaperCards = document.querySelectorAll('#wallpapers .card');
if (!wallpaperMotion.matches && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) if (entry.isIntersecting) {
      entry.target.classList.add('is-visible'); observer.unobserve(entry.target);
    }
  }, { threshold: 0.12 });
  wallpaperCards.forEach(card => { card.classList.add('wallpaper-entry'); observer.observe(card); });
  wallpaperMotion.addEventListener('change', () => {
    if (wallpaperMotion.matches) { observer.disconnect(); wallpaperCards.forEach(card => card.classList.remove('wallpaper-entry')); }
  });
}
// 貼圖以原圖切成橫列顯示，按畫面由上到下逐行浮現。
const stickerMotion = matchMedia('(prefers-reduced-motion: reduce)');
const stickerRows = document.querySelectorAll('.sticker-row');
if (!stickerMotion.matches && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    const entering = entries.filter(entry => entry.isIntersecting)
      .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top || a.boundingClientRect.left - b.boundingClientRect.left);
    entering.forEach((entry, index) => {
      entry.target.style.setProperty('--row-delay', (index * 110) + 'ms');
      entry.target.classList.add('is-visible'); observer.unobserve(entry.target);
    });
  }, { threshold: 0.18 });
  stickerRows.forEach(row => { row.classList.add('can-reveal-row'); observer.observe(row); });
  stickerMotion.addEventListener('change', () => {
    if (stickerMotion.matches) { observer.disconnect(); stickerRows.forEach(row => row.classList.remove('can-reveal-row')); }
  });
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

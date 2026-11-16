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

// 以頁面捲動進度交疊兩張原圖；反向捲動時也能平順返回。
(async function setupCharacterStory() {
  const story = c.characterStory;
  const section = document.querySelector('#character-story');
  if (!story || !section) return;
  section.setAttribute('aria-label', story.label);
  section.textContent = story.pending;
  const stage = el('div', 'character-stage');
  const before = el('div', 'character-before');
  const after = el('div', 'character-after');
  after.setAttribute('aria-hidden', 'true');
  const layers = [];
  for (const [group, sources] of [[before, story.before], [after, story.after]]) {
    for (const src of sources) {
      const image = el('img'); image.src = src; image.alt = '';
      group.append(image); layers.push(image);
    }
  }
  before.setAttribute('role', 'img'); before.setAttribute('aria-label', story.alt);
  const dog = el('p', 'character-trait character-dog', story.dog);
  const green = el('p', 'character-trait character-green', story.green);
  stage.append(before, after, dog, green);
  try { await Promise.all(layers.map(image => image.decode())); }
  catch { return; } // 原圖尚未上傳時不顯示破圖，也不占用長捲動空間。
  section.replaceChildren(stage); section.classList.add('is-ready');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let queued = false;
  function update() {
    queued = false;
    const top = parseFloat(getComputedStyle(stage).top) || 0;
    const distance = Math.max(1, section.offsetHeight - stage.offsetHeight - top);
    const progress = Math.min(1, Math.max(0, (top - section.getBoundingClientRect().top) / distance));
    const t = Math.min(1, Math.max(0, (progress - 0.12) / 0.68));
    const eased = reduced.matches ? 1 : t * t * (3 - 2 * t);
    // 分兩段淡出、淡入；中間保留短暫空隙，兩個版本絕不同時顯示。
    const outgoing = reduced.matches ? 0 : Math.max(0, 1 - eased / 0.45);
    const incoming = reduced.matches ? 1 : Math.max(0, (eased - 0.55) / 0.45);
    before.hidden = outgoing === 0;
    after.hidden = incoming === 0;
    before.style.opacity = outgoing.toFixed(4);
    after.style.opacity = incoming.toFixed(4);
    stage.style.setProperty('--reveal', incoming.toFixed(4));
    stage.style.setProperty('--lift', ((1 - eased) * 12).toFixed(2) + 'px');
  }
  function schedule() { if (!queued) { queued = true; requestAnimationFrame(update); } }
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule);
  reduced.addEventListener('change', schedule);
  update();
})();

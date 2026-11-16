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

// 跟隨捲動柔順淡出、淡入；兩個版本不會同時可見。
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
  let frame = 0;
  let lastTime = 0;
  let displayed = null;
  let start = 0;
  let distance = 1;
  const clamp = value => Math.min(1, Math.max(0, value));
  const smooth = value => value * value * (3 - 2 * value);
  function measure() {
    const top = parseFloat(getComputedStyle(stage).top) || 0;
    start = section.getBoundingClientRect().top + scrollY - top;
    distance = Math.max(1, section.offsetHeight - stage.offsetHeight - top);
    schedule();
  }
  function update(now) {
    frame = 0;
    const target = reduced.matches ? 1 : clamp(((scrollY - start) / distance - 0.12) / 0.68);
    const elapsed = Math.min(64, lastTime ? now - lastTime : 16);
    lastTime = now;
    // 用時間平滑滾輪或觸控的大步跳動，不修改頁面原本的捲動方式。
    if (displayed === null || reduced.matches) displayed = target;
    else displayed += (target - displayed) * (1 - Math.exp(-elapsed / 110));
    if (Math.abs(target - displayed) < 0.0005) displayed = target;
    // 前半段只淡出，後半段才淡入，不再額外停留空白。
    const outgoing = 1 - smooth(clamp(displayed * 2));
    const incoming = smooth(clamp((displayed - 0.5) * 2));
    before.style.opacity = outgoing.toFixed(4);
    after.style.opacity = incoming.toFixed(4);
    stage.style.setProperty('--reveal', incoming.toFixed(4));
    stage.style.setProperty('--lift', ((1 - incoming) * 8).toFixed(2) + 'px');
    if (displayed !== target) schedule();
    else lastTime = 0;
  }
  function schedule() { if (!frame) frame = requestAnimationFrame(update); }
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', measure);
  reduced.addEventListener('change', measure);
  new ResizeObserver(measure).observe(section);
  measure();
})();

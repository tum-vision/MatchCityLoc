'use strict';

// Saved measurements from the same cache that generated the paper's iteration figure.
// Keep a static fallback so the local page also works when opened without an HTTP server.
let recorded = [
  { translation_m: 19.766262743713913, rotation_deg: 1.8635854158535623 },
  { translation_m: 12.895741711486082, rotation_deg: 8.49066854471527 },
  { translation_m: 1.723358921785283, rotation_deg: 0.45522647882311 },
  { translation_m: 0.332146021688032, rotation_deg: 0.1466386323218536 },
];
const buttons = [...document.querySelectorAll('[data-iteration]')];
let current = 0;
let timer = null;
let playing = true;
let playbackReady = false;
let playbackVisible = false;
let matchesLoaded = false;
const play = document.querySelector('#play-iterations');
const matchToggle = document.querySelector('#show-iteration-matches');
const matchLayer = document.querySelector('#iteration-matches');
const panels = document.querySelector('#iteration-panels');
const matchCaption = document.querySelector('#match-caption');
const svgNS = 'http://www.w3.org/2000/svg';
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const transitionOptions = { duration: 600, easing: 'ease-in-out' };
const frameCache = new Map();
let frameRequest = 0;
let requestedIteration = 0;

function loadFrame(index, kind) {
  const url = `assets/experiments/iteration-${index}-${kind}.png`;
  if (!frameCache.has(url)) {
    const image = new Image();
    image.src = url;
    frameCache.set(url, image.decode().then(() => url).catch(error => {
      frameCache.delete(url);
      throw error;
    }));
  }
  return frameCache.get(url);
}

function fadeAway(node, opacity = 1) {
  const animation = node.animate([{ opacity }, { opacity: 0 }], transitionOptions);
  animation.finished.then(() => node.remove(), () => node.remove());
}

function clearMatchTransition() {
  panels.querySelectorAll('.iteration-match-ghost').forEach(node => node.remove());
  matchLayer.getAnimations().forEach(animation => animation.cancel());
}

function crossfadeImage(image, url, smooth) {
  if (smooth) {
    const outgoing = image.cloneNode();
    outgoing.removeAttribute('id');
    outgoing.alt = '';
    outgoing.setAttribute('aria-hidden', 'true');
    outgoing.loading = 'eager';
    outgoing.className = 'iteration-frame-ghost';
    // Keep older fading layers on top: rapid clicks preserve the visible blend.
    image.after(outgoing);
    fadeAway(outgoing);
  }
  image.src = url;
}

function drawMatches() {
  matchLayer.replaceChildren();
  if (!matchesLoaded) {
    matchCaption.textContent = 'Recorded correspondences unavailable; pose renders remain available.';
    return;
  }
  const pairs = recorded[current].matches;
  if (!pairs.length) {
    matchCaption.textContent = 'Final refined pose. No further matching pass was recorded.';
    return;
  }
  if (!matchToggle.checked) {
    matchCaption.textContent = 'Correspondences hidden.';
    return;
  }
  matchCaption.textContent = `${pairs.length} recorded matches used for the next pose update.`;
  const bounds = panels.getBoundingClientRect();
  const query = document.querySelector('#iteration-predicted').getBoundingClientRect();
  const render = document.querySelector('#iteration-normals').getBoundingClientRect();
  matchLayer.setAttribute('viewBox', `0 0 ${bounds.width} ${bounds.height}`);
  function shape(tag, attributes) {
    const node = document.createElementNS(svgNS, tag);
    for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
    matchLayer.appendChild(node);
  }
  for (const pair of pairs) {
    const x1 = query.left - bounds.left + pair.query[0] * query.width;
    const y1 = query.top - bounds.top + pair.query[1] * query.height;
    const x2 = render.left - bounds.left + pair.render[0] * render.width;
    const y2 = render.top - bounds.top + pair.render[1] * render.height;
    shape('line', { x1, y1, x2, y2, stroke: '#302339', 'stroke-width': 2.8, opacity: .35 });
    shape('line', { x1, y1, x2, y2, stroke: '#fff2a0', 'stroke-width': 1.3, opacity: .95 });
    for (const [cx, cy] of [[x1, y1], [x2, y2]]) {
      shape('circle', { cx, cy, r: 2.6, fill: '#fff2a0', stroke: '#44304e', 'stroke-width': 1 });
    }
  }
}

function pause() {
  playing = false;
  syncPlayback();
}

function syncPlayback() {
  clearInterval(timer);
  timer = null;
  play.innerHTML = playing ? '<span aria-hidden="true">Ⅱ</span> Pause' : '<span aria-hidden="true">▶</span> Play loop';
  play.setAttribute('aria-label', playing ? 'Pause recorded refinement' : 'Play recorded refinement in a loop');
  play.setAttribute('aria-pressed', String(playing));
  document.querySelector('.pose-errors').setAttribute('aria-live', playing ? 'off' : 'polite');
  if (playing && playbackReady && playbackVisible && !document.hidden) {
    timer = setInterval(() => showIteration((current + 1) % recorded.length), 1800);
  }
}

play.addEventListener('click', () => {
  playing = !playing;
  syncPlayback();
});
new IntersectionObserver(([entry]) => { playbackVisible = entry.isIntersecting; syncPlayback(); }, { threshold: .15 }).observe(panels);
document.addEventListener('visibilitychange', syncPlayback);
matchToggle.addEventListener('change', () => { clearMatchTransition(); drawMatches(); });
new ResizeObserver(() => { clearMatchTransition(); drawMatches(); }).observe(panels);
reducedMotion.addEventListener('change', () => {
  if (reducedMotion.matches) {
    clearMatchTransition();
    panels.querySelectorAll('.iteration-frame-ghost').forEach(node => node.remove());
  }
});
async function showIteration(index) {
  requestedIteration = index;
  const request = ++frameRequest;
  let urls;
  try {
    urls = await Promise.all(['normals', 'overlay'].map(kind => loadFrame(index, kind)));
  } catch {
    if (request === frameRequest) {
      pause();
      document.querySelector('.playback-hint').textContent = 'This frame could not load. Try selecting it again.';
    }
    return;
  }
  if (request !== frameRequest) return;
  const smooth = current !== index && !reducedMotion.matches;
  if (smooth && matchLayer.childElementCount) {
    const outgoing = matchLayer.cloneNode(true);
    outgoing.removeAttribute('id');
    outgoing.classList.add('iteration-match-ghost');
    const opacity = Number(getComputedStyle(matchLayer).opacity);
    matchLayer.after(outgoing);
    fadeAway(outgoing, opacity);
  }
  matchLayer.getAnimations().forEach(animation => animation.cancel());
  current = index;
  const label = index === 0 ? 'Initial pose' : `Iteration ${index}`;
  buttons.forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.iteration) === index)));
  const normals = document.querySelector('#iteration-normals');
  const overlay = document.querySelector('#iteration-overlay');
  crossfadeImage(normals, urls[0], smooth);
  normals.alt = `LoD surface normals — ${label.toLowerCase()}`;
  crossfadeImage(overlay, urls[1], smooth);
  overlay.alt = `LoD edges projected onto the real UAV photograph — ${label.toLowerCase()}`;
  document.querySelector('#render-state').textContent = label;
  document.querySelector('#pose-state').textContent = label;
  document.querySelector('#translation-error').textContent = `${recorded[index].translation_m.toFixed(1)} m`;
  document.querySelector('#rotation-error').textContent = `${recorded[index].rotation_deg.toFixed(1)}°`;
  drawMatches();
  if (smooth) matchLayer.animate([{ opacity: 0 }, { opacity: 1 }], transitionOptions);
}
buttons.forEach(button => button.addEventListener('click', () => {
  pause();
  showIteration(Number(button.dataset.iteration));
}));
// Preload the small saved frames so loop playback does not wait on image downloads.
Promise.all(Array.from({ length: recorded.length }, (_, i) => ['normals', 'overlay'].map(kind => loadFrame(i, kind))).flat()).then(() => { play.disabled = false; playbackReady = true; syncPlayback(); }).catch(() => {
  document.querySelector('.playback-hint').textContent = 'Some frames could not load. Reload to play.';
});
if (location.protocol !== 'file:') {
  fetch('assets/experiments/iterations.json')
    .then(response => { if (!response.ok) throw new Error('Metrics unavailable'); return response.json(); })
    .then(data => {
      if (data.length === 4 && data.every(row => Number.isFinite(row.translation_m) && Number.isFinite(row.rotation_deg))) {
        recorded = data;
        matchesLoaded = data.every(row => Array.isArray(row.matches) && row.matches.every(pair =>
          ['query', 'render'].every(key => Array.isArray(pair[key]) && pair[key].length === 2 &&
            pair[key].every(value => Number.isFinite(value) && value >= 0 && value <= 1))));
        matchToggle.disabled = !matchesLoaded;
        showIteration(requestedIteration);
      }
    })
    .catch(() => { /* Static paper measurements above remain available. */ });
}

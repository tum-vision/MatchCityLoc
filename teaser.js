'use strict';

// Native, interactive reconstruction of the paper teaser. Flow timing is
// explanatory; correspondence coordinates are from the saved iteration cache.
(() => {
  const root = document.querySelector('#teaser-interactive');
  const host = document.querySelector('#teaser-diagrams');
  const play = document.querySelector('#teaser-play');
  const steps = [...root.querySelectorAll('[data-teaser-step]')];
  const asset = name => `assets/experiments/${name}.png`;
  const image = (name, x, y, width, height, label) => `<image href="${asset(name)}" x="${x}" y="${y}" width="${width}" height="${height}" preserveAspectRatio="xMidYMid meet"><title>${label}</title></image>`;
  const text = (x, y, value, cls = '') => `<text x="${x}" y="${y}" text-anchor="middle" class="${cls}">${value}</text>`;
  const flow = (d, side, step, arrow = true) => `<path d="${d}" class="teaser-flow" data-phase="${step}" ${arrow ? `marker-end="url(#teaser-arrow-${side})"` : ''}/><path d="${d}" class="teaser-flow-packet" data-phase="${step}"/>`;
  function diagram(ours) {
    const side = ours ? 'ours' : 'prior';
    return `<div class="teaser-panel"><h2>${ours ? 'MatchCityLoc' : 'Prior silhouette alignment'}</h2><p class="teaser-panel-subtitle">${ours ? 'Match normals · solve in 3D' : 'Render candidates · score in 2D'}</p>
      <svg viewBox="0 -8 560 500" role="img" aria-labelledby="teaser-title-${side}">
        <title id="teaser-title-${side}">${ours ? 'MatchCityLoc: query image and LoD model, surface normal matching, then PnP and re-rendering' : 'Prior work: query image and LoD model, building silhouettes, then 2D score-based pose selection'}</title>
        <defs><marker id="teaser-arrow-${side}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M1 1 8 5 1 9" fill="none" stroke="currentColor" stroke-width="1.5"/></marker></defs>
        <g class="teaser-layer" data-phase="0">
          <rect class="teaser-focus" x="8" y="0" width="494" height="180" rx="8"/>
          ${text(120, 24, 'UAV image')}${text(390, 24, 'LoD city model')}
          ${image('query', 20, 40, 200, 134, 'Real UAV query from the paper')}
          ${image('teaser-model', 290, 40, 200, 134, 'Original textureless LoD city model from the paper')}
        </g>
        ${flow('M120 180V220', side, 1)}${flow('M390 180V220', side, 1)}
        <g class="teaser-layer" data-phase="1">${text(166, 205, 'Predict', 'teaser-small')}${text(438, 205, 'Render', 'teaser-small')}</g>
        <g class="teaser-layer" data-phase="1">
          <rect class="teaser-focus" x="8" y="227" width="494" height="181" rx="8"/>
          ${ours ? `${image('iteration-predicted', 20, 235, 200, 145, 'Fixed query normals from the recorded experiment')}${image('iteration-2-normals', 290, 235, 200, 145, 'Recorded LoD normals before the third pose update')}` : `${image('teaser-mask', 20, 235, 200, 145, 'Predicted building mask from the paper teaser')}<g class="teaser-mask-stack">${[0, 1, 2].map((i) => `<g class="teaser-mask" style="--mask-delay: ${-i * 1.2}s"><rect x="${285 + i * 16}" y="${238 + i * 19}" width="155" height="104"/>${image(i === 1 ? 'teaser-render-mask-b' : 'teaser-render-mask-a', 285 + i * 16, 238 + i * 19, 155, 104, 'Rendered mask panel extracted from the paper')}</g>`).join('')}</g>`}
          ${text(120, 403, ours ? 'Predicted normals' : 'Predicted building mask', 'teaser-small')}
          ${text(390, 403, ours ? 'Rendered normals' : 'Rendered mask candidates', 'teaser-small')}
        </g>
        ${ours ? '<g id="teaser-matches" aria-hidden="true"></g>' : ''}
        ${flow('M120 410V418H255', side, 2, false)}${flow('M390 410V418H255', side, 2, false)}${flow('M255 418V431', side, 2)}
        <g class="teaser-layer teaser-solver" data-phase="2"><rect class="teaser-focus" x="50" y="432" width="410" height="50" rx="8"/><rect class="teaser-solver-box" x="60" y="440" width="390" height="36" rx="4"/>${text(255, 464, ours ? '3D pose solver · PnP' : '2D score-based pose selection')}</g>
        ${ours ? flow('M462 458H530V110H493', side, 2) : ''}
        ${ours ? '<g class="teaser-layer" data-phase="2"><text x="548" y="300" transform="rotate(-90 548 300)" text-anchor="middle" class="teaser-small teaser-loop-label">Updated pose → re-render</text></g>' : ''}
      </svg></div>`;
  }
  host.innerHTML = diagram(false) + diagram(true);
  const explanations = [
    'Both approaches start with a UAV image and a textureless LoD city model.',
    'Prior work compares building silhouettes. MatchCityLoc uses surface normals as the shared representation.',
    'Instead of selecting a pose by 2D scores, MatchCityLoc lifts matched pixels into 3D, solves PnP, and re-renders at the updated pose.',
  ];
  let selected = 0, playing = true, visible = false, timer = 0;
  function select(index) {
    selected = index;
    root.dataset.step = String(index);
    steps.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
    host.querySelectorAll('[data-phase]').forEach(node => node.classList.toggle('teaser-active', Number(node.dataset.phase) === index));
    document.querySelector('#teaser-explanation').textContent = explanations[index];
    document.querySelector('#teaser-stage-label').textContent = ['01 · Inputs', '02 · Representation', '03 · Pose solve'][index];
  }
  function sync() {
    clearInterval(timer);
    const running = playing && visible && !document.hidden;
    root.classList.toggle('teaser-running', running);
    play.textContent = playing ? 'Ⅱ Pause' : '▶ Play';
    play.setAttribute('aria-pressed', String(playing));
    if (running) timer = setInterval(() => select((selected + 1) % 3), 4200);
  }
  steps.forEach((button, i) => button.addEventListener('click', () => { playing = false; select(i); sync(); }));
  play.addEventListener('click', () => { playing = !playing; sync(); });
  document.addEventListener('visibilitychange', sync);
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); }, { threshold: .2 }).observe(root);
  fetch('assets/experiments/iterations.json').then(response => {
    if (!response.ok) throw new Error('Matches unavailable');
    return response.json();
  }).then(records => {
    const matches = records.find(record => record.iteration === 2).matches;
    const layer = document.querySelector('#teaser-matches');
    for (const [i, pair] of matches.entries()) {
      const x1 = 20 + pair.query[0] * 200;
      const x2 = 290 + pair.render[0] * 200;
      // SVG image uses 'meet'; match its exact 415:300 image aspect ratio.
      const imageHeight = 200 * 300 / 415;
      const ay = 235 + (145 - imageHeight) / 2 + pair.query[1] * imageHeight;
      const by = 235 + (145 - imageHeight) / 2 + pair.render[1] * imageHeight;
      const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      group.classList.add('teaser-match');
      group.style.setProperty('--match-delay', `${-i * .35}s`);
      group.innerHTML = `<path d="M${x1} ${ay}L${x2} ${by}"/><circle cx="${x1}" cy="${ay}" r="2.6"/><circle cx="${x2}" cy="${by}" r="2.6"/>`;
      layer.appendChild(group);
    }
  }).catch(() => {
    const note = document.createElement('p');
    note.className = 'table-note';
    note.textContent = 'Recorded matches could not load. Reload to retry, or view the original paper figure below.';
    root.appendChild(note);
  });
  root.hidden = false;
  document.querySelector('#teaser-fallback').hidden = true;
  select(0);
  sync();
})();

'use strict';

// An explanatory pipeline tour. Images are saved results, not live inference.
(() => {
  const root = document.querySelector('#method-explorer');
  const blocks = [...root.querySelectorAll('[data-method-step]')];
  const play = document.querySelector('#method-play');
  const stages = [
    ['A shared representation', 'MoGe-2 predicts surface normals from the UAV image. This prediction is computed once and reused throughout refinement: matching uses surface orientation rather than RGB texture.', 'UAV image', 'Fixed query normal map'],
    ['Render at the current pose', 'The camera pose and intrinsics define a view of the LoD city model. Rendering provides a normal map for matching and a depth map for lifting matched model pixels into 3D.', 'LoD model · camera pose · intrinsics', 'Rendered normals and depth'],
    ['Match orientation, not texture', 'MINIMA (RoMa) finds correspondences between the fixed query normals and the newly rendered LoD normals. The preview shows recorded matches; the model needs no RGB texture.', 'Query normals · rendered normals', 'Matched query and model pixels'],
    ['Ground the matches in 3D', 'Rendered depth lifts matched model pixels into world coordinates. PnP-RANSAC uses these 3D points and their query-image matches to estimate the camera pose. Within a fixed update budget, validity and divergence guards retain the last accepted pose. Query normals stay fixed.', '2D matches · rendered depth · intrinsics', 'Updated camera pose → render again'],
  ];
  let step = 0, playing = true, visible = false, frame = 0, last = 0, elapsed = 0;
  function select(index) {
    step = index;
    elapsed = 0;
    root.style.setProperty('--method-progress', '0%');
    blocks.forEach((block, i) => block.setAttribute('aria-pressed', String(i === step)));
    const [title, text, input, output] = stages[step];
    document.querySelector('#method-detail-step').textContent = `0${step + 1} / 04`;
    for (const [id, value] of [['title', title], ['text', text]]) document.querySelector(`#method-detail-${id}`).textContent = value;
    document.querySelector('#method-input').textContent = input;
    document.querySelector('#method-output').textContent = output;
    root.dataset.step = String(step);
  }
  function tick(now) {
    if (last) elapsed += now - last;
    last = now;
    if (elapsed >= 3600) select(step === 3 ? 1 : step + 1);
    root.style.setProperty('--method-progress', `${Math.min(100, elapsed / 36)}%`);
    frame = requestAnimationFrame(tick);
  }
  function sync() {
    const running = playing && visible && !document.hidden;
    root.classList.toggle('method-running', running);
    play.textContent = playing ? 'Ⅱ Pause pipeline' : '▶ Play pipeline';
    play.setAttribute('aria-pressed', String(playing));
    if (running && !frame) frame = requestAnimationFrame(tick);
    if (!running) { cancelAnimationFrame(frame); frame = 0; last = 0; }
  }
  blocks.forEach((block, index) => block.addEventListener('click', () => {
    playing = false;
    select(index);
    sync();
  }));
  play.addEventListener('click', () => { playing = !playing; sync(); });
  document.addEventListener('visibilitychange', sync);
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); }, { threshold: 0.15 }).observe(root);
  root.classList.add('method-enhanced');
  play.hidden = false;
  select(0);
  sync();
})();

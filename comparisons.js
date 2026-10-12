'use strict';

// Progressive enhancement: the paper figure and summary table work without JS.
(() => {
  const datasets = window.MATCHCITYLOC_BENCHMARKS;
  if (!Array.isArray(datasets) || !datasets.length) return;
  const datasetSelect = document.querySelector('#benchmark-dataset');
  const splitSelect = document.querySelector('#benchmark-split');
  const lodSelect = document.querySelector('#benchmark-lod');
  const groupSelect = document.querySelector('#benchmark-group');
  const sortButtons = [...document.querySelectorAll('[data-sort]')];
  const body = document.querySelector('#benchmark-body');
  let sortKey = null;
  let ascending = true;
  const bestFirstAscending = key => !['r2', 'r3', 'r5'].includes(key);
  const setupNames = {
    O: 'Off-the-shelf models, without scene-specific training.',
    I: 'In-domain training: trained on imagery from the evaluation domain.',
    'C*': 'Cross-dataset training on InsLoD-Loc, which is not publicly available.',
    GT: 'Oracle evaluation using ground-truth masks, not a deployable mask predictor.',
    '--': 'Initial sensor prior, before visual localization.',
  };
  const tooltip = document.createElement('div');
  tooltip.id = 'table-tooltip';
  tooltip.className = 'table-tooltip';
  tooltip.setAttribute('role', 'tooltip');
  tooltip.hidden = true;
  document.body.appendChild(tooltip);
  let tooltipTarget = null, pinnedTooltip = null, hideTimer = null;
  function hideTooltip() {
    clearTimeout(hideTimer);
    tooltipTarget?.removeAttribute('aria-describedby');
    tooltipTarget = pinnedTooltip = null;
    tooltip.hidden = true;
  }
  function showTooltip(button) {
    clearTimeout(hideTimer);
    if (tooltipTarget !== button) {
      tooltipTarget?.removeAttribute('aria-describedby');
      pinnedTooltip = null;
    }
    tooltipTarget = button;
    tooltip.textContent = button.dataset.tooltip;
    tooltip.hidden = false;
    button.setAttribute('aria-describedby', tooltip.id);
    const rect = button.getBoundingClientRect();
    const width = tooltip.offsetWidth, height = tooltip.offsetHeight;
    tooltip.style.left = `${Math.max(12, Math.min(innerWidth - width - 12, rect.left + rect.width / 2 - width / 2))}px`;
    tooltip.style.top = `${Math.max(12, Math.min(innerHeight - height - 12, rect.top > height + 20 ? rect.top - height - 9 : rect.bottom + 9))}px`;
  }
  function scheduleTooltipHide() {
    if (!pinnedTooltip) hideTimer = setTimeout(hideTooltip, 160);
  }
  function helpButton(label, description, className) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `table-help ${className}`;
    button.textContent = label;
    button.dataset.tooltip = description;
    button.addEventListener('pointerenter', () => showTooltip(button));
    button.addEventListener('pointerleave', scheduleTooltipHide);
    button.addEventListener('focus', () => showTooltip(button));
    button.addEventListener('blur', hideTooltip);
    button.addEventListener('click', () => {
      if (pinnedTooltip === button) hideTooltip();
      else { showTooltip(button); pinnedTooltip = button; }
    });
    return button;
  }
  tooltip.addEventListener('pointerenter', () => clearTimeout(hideTimer));
  tooltip.addEventListener('pointerleave', scheduleTooltipHide);
  document.addEventListener('keydown', event => { if (event.key === 'Escape') hideTooltip(); });
  document.addEventListener('pointerdown', event => {
    if (tooltipTarget && !tooltipTarget.contains(event.target) && !tooltip.contains(event.target)) hideTooltip();
  });
  window.addEventListener('scroll', () => {
    if (!tooltipTarget) return;
    const rect = tooltipTarget.getBoundingClientRect();
    const clip = tooltipTarget.closest('.table-scroll').getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > innerHeight || rect.right < Math.max(0, clip.left)
      || rect.left > Math.min(innerWidth, clip.right)) hideTooltip();
    else showTooltip(tooltipTarget);
  }, true);
  window.addEventListener('resize', hideTooltip);
  function options(select, entries, value) {
    select.replaceChildren(...entries.map(([id, label]) => new Option(label, id)));
    if (entries.some(([id]) => id === value)) select.value = value;
  }
  function dataset() { return datasets.find(item => item.id === datasetSelect.value); }
  function variant() { return dataset().variants.find(item => item.split === splitSelect.value && item.lod === lodSelect.value); }
  function updateLods() {
    const lods = [...new Set(dataset().variants.filter(item => item.split === splitSelect.value).map(item => item.lod))].sort();
    options(lodSelect, lods.map(value => [value, value]), lodSelect.value);
    lodSelect.disabled = lods.length === 1;
  }
  function updateDataset() {
    const splits = [...new Set(dataset().variants.map(item => item.split))];
    options(splitSelect, splits.map(value => [value, value]), splitSelect.value);
    splitSelect.disabled = splits.length === 1;
    updateLods();
    // Start with a full comparison rather than the single-method LoD1 ablation.
    if (datasetSelect.value === 'semcity') lodSelect.value = 'LoD3';
    render();
  }
  function render() {
    hideTooltip();
    const selected = variant();
    const rows = selected.rows.filter(row => groupSelect.value === 'all' || row.group === groupSelect.value);
    // Keep the camera-ready table's comparison groups and protocol exclusions.
    // Filtering/sorting must not promote an oracle or source-protocol result.
    if (sortKey) rows.sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey];
      // Missing results always remain last, regardless of direction.
      if (av === null && bv === null) return 0;
      if (av === null) return 1;
      if (bv === null) return -1;
      const delta = typeof av === 'number' ? av - bv : av.localeCompare(bv);
      return ascending ? delta : -delta;
    });
    body.replaceChildren();
    for (const row of rows) {
      const tr = document.createElement('tr');
      if (row.method.startsWith('MatchCityLoc')) tr.className = 'ours';
      const method = document.createElement('th');
      method.scope = 'row';
      const methodDescription = [
        row.map === 'Textured mesh' ? 'Uses a textured mesh, unlike the LoD-based methods.'
          : row.map === 'Sensor prior' ? 'Initial sensor pose, before visual localization.' : 'Uses a textureless LoD city model.',
        row.method.includes('†') ? '† Adapted re-run using nvdiffrast; equivalence to the original renderer has not been established.' : '',
        row.note || '',
      ].filter(Boolean).join(' ');
      method.appendChild(helpButton(row.method, methodDescription, 'method-help'));
      if (row.map === 'Textured mesh') {
        const map = document.createElement('span');
        map.className = 'method-map';
        map.textContent = 'Textured mesh';
        method.appendChild(map);
      }
      tr.appendChild(method);
      for (const key of ['vision', 'setup', 'translation', 'rotation', 'r2', 'r3', 'r5']) {
        const cell = document.createElement('td');
        cell.dataset.metric = key;
        const value = row[key];
        cell.textContent = value === null ? '—' : typeof value === 'number' ? value.toFixed(2) : value;
        if (typeof value === 'number') cell.dataset.value = String(value);
        if (Number.isFinite(value) && row.ranks?.[key]) {
          const best = row.ranks[key] === 'best';
          cell.classList.add(best ? 'metric-best' : 'metric-second');
          const label = `${best ? 'Best' : 'Second-best'} within the paper's comparison group (ties included)`;
          cell.title = label;
          cell.setAttribute('aria-label', `${cell.textContent}, ${label.toLowerCase()}`);
        }
        if (key === 'setup') cell.replaceChildren(helpButton(value, setupNames[value], 'setup-badge'));
        if (value === null) cell.setAttribute('aria-label', 'Not reported');
        tr.appendChild(cell);
      }
      body.appendChild(tr);
    }
    if (!rows.length) {
      const row = body.insertRow();
      const cell = row.insertCell();
      cell.colSpan = 8;
      cell.textContent = 'No results reported for this setup. Select another setup or model detail.';
    }
    sortButtons.forEach(button => {
      const selected = button.dataset.sort === sortKey;
      button.parentElement.setAttribute('aria-sort', selected ? ascending ? 'ascending' : 'descending' : 'none');
      button.querySelector('span').textContent = selected ? ascending ? '↑' : '↓' : '↕';
      button.title = selected && ascending !== bestFirstAscending(sortKey)
        ? 'Restore original paper order'
        : `Sort ${selected ? ascending ? 'descending' : 'ascending' : bestFirstAscending(button.dataset.sort) ? 'ascending' : 'descending'}`;
    });
    document.querySelector('#benchmark-caption').textContent = `${dataset().label} · ${selected.split} · ${selected.lod} — ${selected.source}. Recall in %, median errors; ‡ marks source-protocol mean translation/yaw.`;
    let note = `${rows.length} methods / configurations. ${sortKey ? `Sorted by ${sortButtons.find(b => b.dataset.sort === sortKey).textContent.replace(/[↕↑↓]/g, '').trim()}, ${ascending ? 'ascending' : 'descending'}.` : 'Original paper order.'}`;
    if (selected.lod === 'LoD1') note += ' Only MatchCityLoc is reported in the LoD1 ablation; baseline results are not available.';
    else if (rows.some(row => row.translation === null)) note += ' — means not reported; missing values sort last.';
    document.querySelector('#benchmark-summary').textContent = note;
  }
  options(datasetSelect, datasets.map(item => [item.id, item.label]));
  datasetSelect.addEventListener('change', updateDataset);
  splitSelect.addEventListener('change', () => { updateLods(); render(); });
  lodSelect.addEventListener('change', render);
  groupSelect.addEventListener('change', render);
  sortButtons.forEach(button => button.addEventListener('click', () => {
    const key = button.dataset.sort;
    if (sortKey !== key) {
      sortKey = key;
      ascending = bestFirstAscending(key);
    } else if (ascending === bestFirstAscending(key)) {
      ascending = !ascending;
    } else {
      sortKey = null;
    }
    render();
  }));
  document.querySelector('#reset-table-order').addEventListener('click', () => { sortKey = null; render(); });
  updateDataset();
  document.querySelector('#benchmark-explorer').hidden = false;
  document.querySelector('#benchmark-fallback').hidden = true;
})();

(() => {
  const template = document.querySelector('#comparison-explorer');
  template.querySelectorAll('[id]').forEach(node => { node.dataset.control = node.id; });
  const scenes = ['uav-in', 'swiss-in', 'semcity', 'swiss-out'];
  const cards = scenes.map((_, i) => {
    if (i === 0) return template;
    const card = template.cloneNode(true);
    card.id = `comparison-explorer-${i + 1}`;
    card.querySelectorAll('[id]').forEach(node => { node.id = `${node.dataset.control}-${i + 1}`; });
    document.querySelector('#comparison-grid').appendChild(card);
    return card;
  });
  cards.forEach((card, i) => setupComparison(card, scenes[i]));

  function setupComparison(root, initialScene) {
  const control = name => root.querySelector(`[data-control="${name}"]`);
  const scene = control('comparison-scene');
  const left = control('comparison-left');
  const right = control('comparison-right');
  const stage = control('comparison-stage');
  const slider = control('comparison-position');
  const status = control('comparison-status');
  const methods = [
    ['gps', 'Pose prior'], ['mc', 'MatchCityLoc'], ['v2', 'LoD-Loc v2 · off-the-shelf masks'],
    ['v3', 'LoD-Loc v3 · oracle masks'], ['sem', 'SemCityLoc · off-the-shelf masks'], ['gt', 'Ground truth'],
  ];
  const shortNames = { gps: 'Pose prior', mc: 'MatchCityLoc', v2: 'LoD-Loc v2', v3: 'LoD-Loc v3 (oracle)', sem: 'SemCityLoc', gt: 'Ground truth' };
  const extraScenes = window.MATCHCITYLOC_EXTRA_SCENES || [];
  for (const group of [...new Set(extraScenes.map(item => item.group))]) {
    const options = document.createElement('optgroup');
    options.label = group;
    for (const item of extraScenes.filter(item => item.group === group)) options.appendChild(new Option(item.label, item.id));
    scene.appendChild(options);
  }
  let request = 0;
  let dragging = false;
  const images = new Map();
  function loadImage(url) {
    if (!images.has(url)) {
      const image = new Image();
      image.src = url;
      images.set(url, image.decode().then(() => image).catch(error => { images.delete(url); throw error; }));
    }
    return images.get(url);
  }
  async function update() {
    const token = ++request;
    const selectedScene = scene.value, leftMethod = left.value, rightMethod = right.value;
    const sceneName = scene.selectedOptions[0].textContent;
    root.setAttribute('role', 'group');
    root.setAttribute('aria-label', `${sceneName} comparison`);
    stage.setAttribute('aria-busy', 'true');
    status.textContent = 'Loading selected result panels…';
    try {
      const [a, b] = await Promise.all([leftMethod, rightMethod].map(method => loadImage(`assets/experiments/compare-${selectedScene}-${method}.webp?v=camera-ready-1`)));
      if (token !== request) return;
      const leftImage = control('comparison-left-image');
      const rightImage = control('comparison-right-image');
      leftImage.src = a.src;
      rightImage.src = b.src;
      leftImage.alt = `${sceneName}: ${methods.find(([id]) => id === leftMethod)[1]} pose reprojected onto the UAV image`;
      rightImage.alt = `${sceneName}: ${methods.find(([id]) => id === rightMethod)[1]} pose reprojected onto the UAV image`;
      stage.style.aspectRatio = `${a.naturalWidth} / ${a.naturalHeight}`;
      control('comparison-left-label').textContent = shortNames[leftMethod];
      control('comparison-right-label').textContent = shortNames[rightMethod];
      const errors = control('comparison-errors');
      errors.replaceChildren(...[leftMethod, rightMethod].map(method => {
        const cell = document.createElement('span');
        const error = window.MATCHCITYLOC_PANEL_ERRORS?.[selectedScene]?.[method];
        cell.textContent = `${shortNames[method]}: ${method === 'gt' ? 'reference pose' : error ? `${error.translation.toFixed(1)} m / ${error.rotation.toFixed(1)}°` : 'error not available'}`;
        return cell;
      }));
      status.textContent = leftMethod === rightMethod ? 'The same method is selected on both sides. Choose different methods to compare.' : 'Drag the divider, or focus it and use the arrow keys.';
    } catch {
      if (token === request) status.textContent = 'The selected panels could not load. Please select the sample again to retry.';
    } finally {
      if (token === request) stage.setAttribute('aria-busy', 'false');
    }
  }
  function setPosition(value) {
    const position = Math.max(0, Math.min(100, Math.round(value)));
    slider.setAttribute('aria-valuenow', String(position));
    stage.style.setProperty('--split', `${position}%`);
    slider.setAttribute('aria-valuetext', `${position}% left method, ${100 - position}% right method`);
  }
  function drag(event) {
    const rect = stage.getBoundingClientRect();
    setPosition(100 * (event.clientX - rect.left) / rect.width);
  }
  for (const select of [left, right]) {
    select.replaceChildren(...methods.map(([id, label]) => new Option(label, id)));
    select.addEventListener('change', update);
  }
  left.value = 'gps';
  right.value = 'mc';
  scene.addEventListener('change', () => {
    const selected = extraScenes.find(item => item.id === scene.value);
    const available = methods.filter(([id]) => !selected || selected.methods.includes(id));
    for (const select of [left, right]) {
      const previous = select.value;
      select.replaceChildren(...available.map(([id, label]) => new Option(label, id)));
      if (available.some(([id]) => id === previous)) select.value = previous;
      else if (select === left) select.value = available.some(([id]) => id === 'gps') ? 'gps' : available.some(([id]) => id === 'v2') ? 'v2' : 'mc';
      else select.value = left.value === 'mc' && available.some(([id]) => id === 'gt') ? 'gt' : 'mc';
    }
    // When entering a failure example from a baseline view, compare ours to GT.
    if (selected?.group === 'Failure cases' && left.value === right.value) {
      left.value = 'mc';
      right.value = 'gt';
    }
    control('comparison-example-note').textContent = selected?.note || '';
    update();
  });
  slider.addEventListener('keydown', event => {
    const current = Number(slider.getAttribute('aria-valuenow'));
    const positions = { ArrowLeft: current - 1, ArrowDown: current - 1, ArrowRight: current + 1, ArrowUp: current + 1, PageDown: current - 10, PageUp: current + 10, Home: 0, End: 100 };
    if (!(event.key in positions)) return;
    event.preventDefault();
    setPosition(positions[event.key]);
  });
  stage.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    slider.focus({ preventScroll: true });
    dragging = true;
    stage.setPointerCapture(event.pointerId);
    drag(event);
  });
  stage.addEventListener('pointermove', event => { if (dragging) drag(event); });
  stage.addEventListener('pointerup', () => { dragging = false; });
  stage.addEventListener('pointercancel', () => { dragging = false; });
  stage.addEventListener('lostpointercapture', () => { dragging = false; });
  root.hidden = false;
  setPosition(50);
  scene.value = initialScene;
  scene.dispatchEvent(new Event('change'));
  }
})();

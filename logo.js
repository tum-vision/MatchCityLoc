'use strict';

// Branding animation only: these illustrative matches are not experiment data.
(() => {
  const logo = document.querySelector('#animated-logo');
  const drone = document.querySelector('#logo-drone');
  const frustum = document.querySelector('#logo-frustum path');
  // Lift the original blades into separate SVG layers; keep the bitmap intact.
  // A flattened rotation plane preserves the drone's oblique perspective.
  const svgNS = 'http://www.w3.org/2000/svg';
  function svg(tag, attributes = {}) {
    const element = document.createElementNS(svgNS, tag);
    Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
    return element;
  }
  const defs = logo.querySelector('defs');
  const body = drone.querySelector('image');
  const motionBlur = svg('filter', { id: 'logo-rotor-blur', filterUnits: 'userSpaceOnUse', x: -220, y: -220, width: 440, height: 440 });
  motionBlur.append(svg('feGaussianBlur', { stdDeviation: 2.8 }));
  defs.append(motionBlur);
  const bladeMask = svg('mask', { id: 'logo-blade-mask', maskUnits: 'userSpaceOnUse', x: 0, y: 0, width: 1536, height: 1024, 'mask-type': 'luminance' });
  bladeMask.append(svg('rect', { width: 1536, height: 1024, fill: 'white' }));
  const rotors = [
    { x: 153, y: 73, direction: 1, period: 1150, path: 'M137 70C104 69 55 85 35 103L44 114C82 113 116 103 140 88L160 78C200 69 235 52 260 35L251 30C215 34 181 46 157 60Z' },
    { x: 533, y: 78, direction: -1, period: 1230, path: 'M515 65C476 48 425 32 393 34L385 40C413 58 463 81 503 78L535 86C579 99 640 117 675 118L686 111C639 94 585 78 552 73Z' },
    { x: 201, y: 196, direction: -1, period: 1180, path: 'M180 178C141 158 82 140 51 141L43 148C72 169 119 198 158 193L201 201C235 209 281 222 320 228L327 222C285 208 245 195 223 191Z' },
    { x: 680, y: 195, direction: 1, period: 1260, path: 'M674 183C682 166 716 146 741 146L754 150C747 176 723 195 697 199L678 205C677 222 651 245 629 247L616 241C618 223 632 203 655 196Z' },
  ].map((rotor, index) => {
    const clip = svg('clipPath', { id: `logo-blades-${index}` });
    clip.append(svg('path', { d: rotor.path }));
    defs.append(clip);
    bladeMask.append(svg('path', { d: rotor.path, fill: 'black', stroke: 'black', 'stroke-width': 6, 'stroke-linejoin': 'round' }));
    const plane = svg('g', { transform: `translate(${rotor.x} ${rotor.y}) scale(1 .38)`, 'aria-hidden': 'true' });
    // The faint swept disc stays steady while translucent angular samples give
    // the fast blades a shutter-like trail instead of a sharp, flickering edge.
    const radius = [158, 176, 185, 133][index];
    plane.append(svg('circle', { r: radius, fill: '#899095', 'fill-opacity': .09, stroke: '#b6a085', 'stroke-opacity': .18, 'stroke-width': 3 }));
    const spin = svg('g', { class: 'logo-propeller', filter: 'url(#logo-rotor-blur)' });
    const unproject = svg('g', { id: `logo-propeller-art-${index}`, transform: `scale(1 ${1 / .38}) translate(${-rotor.x} ${-rotor.y})` });
    const blades = body.cloneNode(false);
    blades.setAttribute('clip-path', `url(#logo-blades-${index})`);
    unproject.append(blades);
    defs.append(unproject);
    [.045, .07, .1, .15, .48].forEach((opacity, sample) => {
      spin.append(svg('use', {
        href: `#logo-propeller-art-${index}`,
        transform: `rotate(${-rotor.direction * (4 - sample) * 22})`,
        opacity,
        class: 'logo-propeller-trail',
      }));
    });
    plane.append(spin);
    drone.append(plane);
    return { ...rotor, period: rotor.period / 6.5, spin };
  });
  defs.append(bladeMask);
  body.setAttribute('mask', 'url(#logo-blade-mask)');
  // Always enabled; suspend only while offscreen or in a background tab.
  let visible = true, frame = 0, last = 0, elapsed = 0;
  function draw(x, y) {
    drone.setAttribute('transform', `translate(${x} ${y})`);
    const apex = `${455 + x} ${273 + y}`;
    frustum.setAttribute('d', `M${apex} 440 536M${apex} 774 428M${apex} 819 806M${apex} 522 964`);
  }
  function animate(now) {
    if (last) elapsed += now - last;
    last = now;
    const phase = elapsed / 6400 * Math.PI * 2;
    draw(28 * Math.sin(phase), -32 * Math.sin(phase * 2));
    rotors.forEach(({ spin, direction, period }) => {
      spin.setAttribute('transform', `rotate(${direction * (elapsed % period) / period * 360})`);
    });
    frame = requestAnimationFrame(animate);
  }
  function sync() {
    const running = visible && !document.hidden;
    logo.classList.toggle('logo-running', running);
    if (running && !frame) frame = requestAnimationFrame(animate);
    if (!running) { cancelAnimationFrame(frame); frame = 0; last = 0; }
  }
  logo.classList.add('logo-enhanced');
  document.addEventListener('visibilitychange', sync);
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); }).observe(logo);
  sync();
})();

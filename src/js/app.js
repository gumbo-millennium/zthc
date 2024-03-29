/**
 * Plasma effect
 * Basic effect by Kevin Roast (10/8/11) <http://www.kevs3d.co.uk/dev/>
 * Modifications by Roelof <https://github.com/roelofr/plasma>
 */

import Plasma from './plasma';

const selector = 'canvas[data-content="thc"]';

window.addEventListener('DOMContentLoaded', () => {
  const windowRatio = window.innerWidth / window.innerHeight;
  const plasma = new Plasma(selector, {
    CycleSpeed: 2,
    ShowFPS: process.env.production === false,
    PlasmaDensity: (windowRatio < 1) ? 48 : 92,
    TimeFunction: 1024,
    PaletteIndex: ~~((Math.random() * 128) % 2) + 2,
  });

  plasma.start();

  window.plasma = plasma;
});

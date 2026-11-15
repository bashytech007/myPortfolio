import { initThemeControls } from './theme';
import { initReveal } from './reveal';

initThemeControls();
initReveal();

// Code blocks that scroll sideways must be reachable from the keyboard.
for (const block of document.querySelectorAll<HTMLElement>('.prose pre')) {
  if (block.scrollWidth > block.clientWidth) {
    block.tabIndex = 0;
    block.setAttribute('role', 'region');
    block.setAttribute('aria-label', 'Code sample');
  }
}

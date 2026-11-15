# Design rules

Standing rules for this site. `docs/design-notes.md` explains the look; this
file records the rules that code and review have to hold to.

## Motion

- **Allowed loops:** the terminal cursor, the hero cursor, and the ticker
  (slow, pausable with a mouse or the button beside it, a static wrapped list
  under reduced motion). Nothing else loops.
- **Animate `transform` and `opacity` only.** No layout properties. Colour and
  border-colour changes are allowed as short fades.
- **Hover effects only for fine pointers**, inside
  `@media (hover: hover) and (pointer: fine)`. **Press effects confirm every
  tap** on a button.
- **Durations come from the token scale** in `src/styles/global.css`:
  `--dur-press` 120ms for a press, `--dur` 160ms for colour, `--dur-move` 240ms
  for movement, and one hero entrance of up to 620ms. Easing is `--ease` for
  colour and `--ease-out` for movement.
- **Reduced motion removes movement and loops.** What is left is a plain fade or
  nothing. Smooth scrolling only exists inside
  `prefers-reduced-motion: no-preference`.
- **Keyboard actions are never animated** (terminal output, history, completion).
- **Nothing is hidden if JavaScript fails, and nothing is hidden when printed.**

### What is built

| Motion | Where | Values | Under reduced motion |
| --- | --- | --- | --- |
| Hero entrance, once per load | `src/pages/index.astro` | Fill mode `both`, so the end state is held and the page's largest paint is counted at first paint. Name rises inside its clipped lines at 0 and 60ms (520ms each); roles and statement fade in with an 8px rise at 180ms, both buttons at 240ms, facts fade in at 300ms (320ms each). Over at 620ms. | The name is simply there; the rest fades in over 240ms with no movement. |
| Section reveal, once per section | `src/scripts/reveal.ts`, `global.css` | Opacity and an 8px rise over 240ms. Sections already passed, jumped over, or within reach of a followed link appear with no fade. | Nothing is hidden, so nothing fades. |
| Ticker | `src/pages/index.astro` | One loop in 48s, `transform` only. Pauses under a mouse pointer, and with the 44px pause button at the end of the strip (`aria-pressed`, keyboard and touch). The strip height is unchanged. | A static wrapped list; the button is hidden. Without script the button is hidden and the strip simply runs. |
| Cursors | hero, terminal | Opacity steps, 1.2s and 1.1s. | Static. |
| Button lift and press | `global.css`, `Header.astro` | 2px lift at 160ms for a mouse. Press: buttons and the nav terminal link scale to 0.97, the theme and menu buttons to 0.95, at 120ms. Terminal chips change background instead. | No lift, no scale; colours still change. |
| Hover details, mouse only | nav, project cards, arrow links | Underline sweep, screenshot scale of 1.02 and arrow nudges at 240ms; colours at 160ms. | Colours only. |
| Terminal boot lines | `src/scripts/terminal/intro.ts` | About 470ms, once per browser session; any key or click skips it. | Not played. |
| Theme switch | `src/scripts/theme.ts` | No transition: everything changes in one frame. | The same. |
| Smooth scrolling | `global.css` | Browser-timed; `scroll-padding-top` clears the sticky header. | Off. |

Known gap: text links change colour on hover but have no press state.

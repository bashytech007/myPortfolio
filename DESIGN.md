# Design rules

Standing rules for this site. `docs/design-notes.md` explains the look; this
file records the rules that code and review have to hold to.

## Motion

- **Allowed loops:** the terminal cursor, the hero cursor, and the ticker
  (slow, pausable on hover and keyboard focus, a static wrapped list under
  reduced motion). Nothing else loops.
- **Animate `transform` and `opacity` only.** No layout properties. Colour and
  border-colour changes are allowed as short fades.
- **Hover effects only for fine pointers**, inside
  `@media (hover: hover) and (pointer: fine)`. **Press effects confirm every
  tap**: `:active` scales buttons to 0.97 and icon buttons to 0.95.
- **Durations come from the token scale** in `src/styles/global.css`:
  `--dur-press` 120ms for a press, `--dur` 160ms for colour, `--dur-move` 240ms
  for movement, and one hero entrance of up to 620ms. Easing is `--ease` for
  colour and `--ease-out` for movement.
- **Reduced motion removes movement and loops.** What is left is a plain fade or
  nothing. Smooth scrolling only exists inside
  `prefers-reduced-motion: no-preference`.
- **Keyboard actions are never animated** (terminal output, history, completion).
- **Nothing is hidden if JavaScript fails, and nothing is hidden when printed.**

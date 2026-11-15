# Design notes

What makes two reference sites look finished, and how each principle is used
here. The references are jacinto.design (an editorial portfolio) and its
terminal edition, looked at in a browser at 1440px and 390px wide on
15 November 2026. Nothing from them is reused: no text, images, code, fonts or
colours. Only the principles below.

## What the editorial site does

**Colour.** Five roles and no more: a near-black background with a slight
tint, one raised surface a step lighter, an off-white for text carrying the
same tint, one muted colour for all secondary text, and one accent that
appears only on links and the current item. A second hue shows up once, on the
wordmark. Borders are not a colour of their own: they are the muted colour at
about 20% opacity.

**Type.** Three families with fixed jobs. A heavy display face for the
wordmark, headings and big numerals; a neutral sans for sentences; a monospace
for labels. The scale jumps instead of stepping: 11px labels, 16 to 18px body,
30 to 36px project titles, 48px section statements, 60px numerals, and a
wordmark sized to the viewport. Display type is set tight (line height 0.85 to
1.05, tracking about -0.025em). Labels are the opposite: uppercase, tracked out
to 0.18em. Body copy stays at line height 1.6 and under 36rem wide.

**Spacing.** One 68rem column with 40px gutters (24px on a phone). Everything
is a multiple of 8: 16 between a title and its text, 24 before tags, 56 around
a project, 80 between a section heading and its content, 128 above and below
a section (96 on a phone). The gaps are large and they repeat exactly.

**Borders.** Hairlines do the dividing. Each section opens with a rule and 40px
of space, list items are separated by rules, and nothing sits in a filled box.
Screenshots get a 12px radius and the same hairline. The one solid shape is a
pill button in the text colour.

**Hover.** Small and consistent. Navigation links grow an underline from one
side. Text links are already in the accent. Rows in the link list change colour
as a whole. Screenshots scale up 2% inside their frame. Hover effects only
exist for a mouse; a tap gets a press state instead.

**Motion.** Short and composited. The wordmark and buttons arrive in one
entrance of about 620ms, sections fade in once over 240ms with a rise of 8px
at most, buttons dip slightly when pressed, and a slow strip of words drifts
sideways (pausable). The only other loops are the two block cursors. Everything
is removed or reduced to a simple fade under reduced motion. The rules are in
`DESIGN.md`.

**Rhythm.** Every section starts the same way: rule, small numbered label
("01 / ..."), then a large statement. Projects repeat one unit: big numeral,
small category label, title, two lines of description, a line of tools, links,
and a screenshot. On a phone the same unit stacks in the same order.

## What the terminal site does

**It is the whole screen.** No page around it. One bezel with a soft inner
glow, and a row of shortcut buttons pinned to the bottom for touch.

**Three brightness levels of one hue.** Dim for boot lines and hints, normal
for output, bright and bold for what was typed and for headings. Themes swap
the hue and keep the three levels.

**Columns line up.** `help` is grouped under short headings with commands in
one column and descriptions in the next. The project list is a table: id,
name, year, type.

**It teaches itself.** A boot sequence ends on "type help". Help ends with the
keyboard shortcuts and a hint that some commands are unlisted. A dim suggestion
completes what is being typed.

**At 390px** it keeps the same font size and lets lines wrap; the shortcut
buttons become the main way in.

## How this site uses them

| Principle | Here |
| --- | --- |
| Five colour roles | The existing graphite and orange tokens, darkened a step. Hairlines are text colour at low opacity. Light theme kept. |
| Three type jobs | Inter at weight 800 for display (no new font files), Inter for body, JetBrains Mono for labels. |
| A scale that jumps | 11px labels, 17 to 18px body, `--text-2xl` titles, `--text-3xl` statements, a viewport-sized name in the hero. |
| 8px spacing, big section gaps | `--s-*` tokens, `--band-pad` of 6 to 9rem, 69rem column. |
| Hairlines, not boxes | `.section-head` rule and label, `.rows` lists, 12px radius on screenshots only. |
| Numbered sections | `SectionHead.astro` numbers each home section in order. |
| One repeated project unit | `ProjectCard.astro`: screenshot, numeral and label, title, summary, tools, links. Laid out as a two-column grid with the second column dropped. |
| Small hover states, for a mouse only | Underline sweep in the nav, screenshot scale in its frame, whole-row colour in lists, arrow nudge on links, a 2px lift on buttons. A press state confirms every tap. |
| Few, short motions | One hero entrance, a 240ms fade for each section, a slow pausable strip of work areas, two blinking cursors. All off or reduced to a fade under reduced motion. |
| Terminal as its own place | `/terminal`, full screen, reached from the nav. Boot lines report real facts about this site. Amber, green and mono phosphor themes. Grouped help, aligned project table, inline suggestion, shortcut bar. |

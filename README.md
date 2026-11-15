# Bashir Aremu: portfolio

A static [Astro](https://astro.build) site positioned around application
security, DevSecOps and full-stack work. The main site is editorial: a large
name, numbered sections and a screenshot-led project grid. The terminal is a
separate full-screen page at `/terminal`, linked from the navigation.

The design principles behind it are written down in
[`docs/design-notes.md`](docs/design-notes.md).

## Run it locally

Needs Node 22.23.4 or newer (Node 24 works).

```bash
npm install
npm run dev        # http://localhost:4321, drafts visible
```

To see exactly what will be deployed, including the security headers:

```bash
npm run build      # type-check, build, then verify the output
npm run preview    # serves dist/ with the headers from vercel.json
```

`astro preview` does not work with the Vercel adapter, which is why
`npm run preview` is a small Node script (`scripts/preview.mjs`).

| Command            | What it does                                             |
| ------------------ | -------------------------------------------------------- |
| `npm run dev`      | Dev server with hot reload                               |
| `npm run check`    | Type-check `.astro` and `.ts` files                      |
| `npm run build`    | Check, build to `dist/`, run `scripts/verify-build.mjs`  |
| `npm run preview`  | Serve the build with the production response headers     |
| `npm run contrast` | Check the colour tokens against WCAG AA                  |

## Editing content

Nothing below needs a component change.

| What                       | Where                                   |
| -------------------------- | --------------------------------------- |
| Name, headline, about text | `src/content/site.json`                 |
| Roles above the name       | `src/content/site.json` (`roles`)       |
| Strip under the hero       | `src/content/site.json` (`disciplines`, `credentials`) |
| Experience timeline        | `src/content/site.json` (`experience`)  |
| Focus areas                | `src/content/site.json` (`focus`)       |
| Email and profile links    | `src/content/links.json`                |
| Projects                   | `src/content/projects/*.md`             |
| Write-ups                  | `src/content/writeups/*.md`             |

### Add a role to the timeline

Add an entry to `experience` in `src/content/site.json`, newest first, with
`role`, `org` and `start` (`"YYYY-MM"`). Leave `end` out while the role is
current: it is then shown as "Present", and its organisation is listed under
"Currently" in the hero and the about facts. The terminal's `experience`
command prints the same list.

### Add a write-up

Copy one of the drafts in `src/content/writeups/`, rename the file (the file
name becomes the URL), fill it in and set `draft: false`.

Every write-up must have exactly these `##` headings, in this order:
**Context, Threat model, Finding, Impact, Fix.** The build fails with a
message naming the file if one is missing or renamed.

### Add a project

Add a Markdown file to `src/content/projects/`. Set `kind` to `security` or
`development`. Give it an `image` (a screenshot in
`src/content/projects/images/`, 16:10 works best) to show it as a card in the
grid; without one a development project is listed in the numbered index under
"Earlier builds". Set `featured: true` to show it on the home page, which only
takes projects that have a screenshot.

A card with no screenshot shows a hatched frame reading "TODO: add a
screenshot". Today only the draft security tool does.

The file name is the project's id in the terminal (`open <id>`,
`cat projects/<id>.md`).

### Drafts

Entries with `draft: true` appear in `npm run dev` and are left out of
production builds. To include them in a build (for example on a preview
deployment), set `SHOW_DRAFTS=true`.

## How it is put together

```
src/
  content/          site copy, projects and write-ups
  content.config.ts collection schemas
  layouts/Base.astro  <head>, navigation, footer (both left out with `bare`)
  components/       Header, Footer, SectionHead, ProjectCard, lists, Terminal
  lib/              content queries, site data, the terminal banner
  pages/            /, /writeups, /projects, /security, /terminal, 404,
                    robots.txt, sitemap.xml
  scripts/          theme, navigation, scroll reveal, terminal (TypeScript, no framework)
  styles/           global.css (tokens, type, layout), terminal.css
docs/               design-notes.md
public/             theme-init.js, favicon, og.png
scripts/            preview server, build verification, contrast check
vercel.json         response headers
```

### The main site

Every home page section opens with `SectionHead.astro`: a rule, a numbered
label and a statement. The numbers are counted in `src/pages/index.astro`, so
a section that is not shown (write-ups, until one is published) does not
leave a gap. Colours, the type scale and spacing are tokens at the top of
`src/styles/global.css`; `npm run contrast` checks the colours.

### The terminal

`/terminal` is the whole screen, with no site header or footer.
`src/components/Terminal.astro` renders the boot lines and banner shown on
load and the output of every command at build time (inside `<template>`
elements). The script in `src/scripts/terminal/` clones those templates. Typed
input is only ever written to the page with `textContent`.

- Commands live in `src/scripts/terminal/commands.ts`. Each one can return a
  promise. To list a new one in `help`, add it to the `help` groups in
  `Terminal.astro`.
- The boot lines are facts read from `vercel.json` and `package.json`, and
  `headers` prints the security headers from `vercel.json`, so neither can
  drift from what the site sends.
- The name banner is drawn by `src/lib/banner.ts` from `name` in `site.json`.
- `theme amber|green|mono` and `crt on|off` are stored on the device and
  applied before first paint by `public/theme-init.js`. The colours are at
  the top of `src/styles/terminal.css`.

### Phase 2: the chat challenge

`chat` currently prints "Coming soon". To add the real thing:

1. Create `src/pages/api/chat.ts` exporting a `POST` handler, with
   `export const prerender = false`. The Vercel adapter is already installed,
   so this becomes one serverless function and the rest of the site stays
   static.
2. Replace the `chat` entry in `commands.ts` with a `fetch('/api/chat')` call
   and print the reply with `shell.print()`.
3. Keep the API key in a Vercel environment variable. Do not commit it.

The Content-Security-Policy already allows same-origin requests
(`connect-src 'self'`), so no header change is needed.

## Security

The policy and headers are in `vercel.json` and explained on `/security`,
which reads that file at build time.

- No inline scripts, inline styles or event-handler attributes anywhere.
  `scripts/verify-build.mjs` fails the build if one appears, or if a page
  loads anything from another origin.
- `public/theme-init.js` is a file rather than an inline script for the same
  reason. It applies the saved theme before first paint.
- Markdown code blocks are not syntax highlighted, because Astro's highlighter
  uses inline styles.
- Dependencies are pinned to exact versions (`.npmrc` sets `save-exact`).
- Vercel's preview toolbar is blocked by the policy on preview deployments.
  That is expected.

### Flags

Three flags are hidden for visitors to find (`robots.txt`, a response header,
and a terminal command that `help` does not list). `submit <flag>` checks them
in the browser against SHA-256 digests in `src/scripts/terminal/flags.ts`.
To change a flag, change it where it is served, update its digest, and the
build check will confirm they match. They are a game: anyone who reads this
repository can find all three.

## Deploying

The live site deploys from `master`. This work is on `redesign` and has not
been merged.

- Vercel detects Astro. No build settings are needed beyond the defaults.
- Set `SITE_URL` (for example `https://example.com`) in the Vercel project's
  environment variables. It is used for canonical links, the sitemap,
  `security.txt` and the Open Graph image URL. Without it the Vercel
  production URL is used.
- After the first deployment, confirm the headers are being sent:
  `curl -sI https://your-domain/`.

### Share image

`public/og.png` is rendered from `scripts/og-image.html`. The command to
regenerate it is at the top of that file.

The screenshot on the "This site" project card
(`src/content/projects/images/this-site.png`) is the home page at 1440x900.
Retake it the same way after a visible change to the hero:

```bash
chrome --headless --hide-scrollbars --window-size=1440,900   --virtual-time-budget=8000   --screenshot=src/content/projects/images/this-site.png http://localhost:4321/
```

## Fonts

Inter and JetBrains Mono are vendored in `src/assets/fonts/` (Latin subset,
variable weight) under the SIL Open Font License. The licence files are next
to them.

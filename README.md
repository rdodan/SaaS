# Local agency starter

A free-to-run starting point for selling websites, Google profile and review help,
local SEO and video to local businesses.

- **Public site** (`index.html`): presents the services and collects free-audit requests.
- **Lead finder** (`leads/`): finds local businesses from OpenStreetMap, ranks them by
  what is missing online, and tracks your outreach.
- **Playbook** (`docs/PLAYBOOK.md`): who to target, how to pitch, how to deliver each service.

No build step, no server, no accounts. It is plain HTML, CSS and JavaScript.

## Run it

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000 for the site and http://localhost:8000/leads/ for the lead finder.

## Make it yours

Edit `config.js`: business name, area, email and phone. The site text is in `index.html`.

## Contact form

With `formEndpoint` empty, the form opens the visitor's email app with the message
filled in, which needs no account. To receive submissions directly, create a free form
endpoint (for example Formspree or Web3Forms) and paste its URL into `formEndpoint`.

## Lead finder

- Searches by town and radius using OpenStreetMap (Nominatim and Overpass). No key, no cost.
- OpenStreetMap has no review data. Each row links to Google Maps; type the rating and
  review count you see into the row and the score updates.
- **Map view:** switch between List and Map. Dots are coloured by opportunity and turn grey
  once you have contacted a business.
- **Email drafts:** "Draft email" writes a first message built around what that business is
  missing, with a link to the matching example site. You review it, then it opens in your own
  email app to send, and the business is marked Contacted. After 7 days it is flagged
  "Follow-up due" and the button drafts a short follow-up. Set `yourName` and `siteUrl` in
  `config.js` first.
- OpenStreetMap only has an email for some businesses. For the rest, "Search for an email"
  opens a web search, and you can paste what you find into the draft.
- Your list, stages and notes live in your browser only. Use **Backup** regularly and
  **Restore** to move to another browser or computer.
- The page is hidden from search engines but is not password protected. It contains
  no data of its own, so anyone opening it sees an empty tool.
- The public OpenStreetMap servers are shared and rate limited. If a search says the
  server is busy, wait a minute or use a smaller radius.

## Client-site templates and catalog

`templates/` holds a reusable site for client businesses and a catalog page to show prospects.

- **Catalog:** open `templates/index.html`. It previews every example and is linked from the agency site as "Examples".
- **Five examples, five layouts:** `restaurant`, `gym`, `detailing`, `barber` and `trades`. They are
  made-up businesses with placeholder details. Each is one config file in `templates/sites/`
  holding its colours, fonts, wording and content.
- **Pick the building blocks per client.** In the config:
  - `theme.skin`: the overall design language. `cinema` (dark, giant headings), `magazine`
    (label column beside the content), `brutal` (oversized, sharp, numbered), `classic`
    (centred and framed) or `friendly` (soft cards and a coloured call to action).
  - `hero.style`: `film` (story that plays as you scroll), `poster` (full-screen headline),
    `split` (words beside a picture) or `bold` (stacked type with a row of figures).
  - `theme.header`: `bar`, `centered` or `pill`. `theme.pattern` sets the placeholder art.
  - `services.layout`: `packs` (detailed packages), `cards` or `list` (a price list).
  - Sections: `menu` (categories, prices, dietary filters), `plans` (membership or pricing
    cards), `timetable` (classes by day, opens on today), `team`, `hours` (with an open-now
    light), `beforeAfter`, `process`, `work` (gallery), `areas` (town checker), `faq`, `quote`.
  - `order` lists which sections appear and in what order. Leave one out and it is not shown.
- **Every site also has** a scripted chat, a Call / Text / Quote bar on phones and a multi-step
  quote or booking form.

### New client site

1. Copy the closest example in `templates/sites/` to `templates/sites/<client>.js` and edit it.
2. Preview at `templates/site/index.html?site=<client>`.
3. Add photos by setting `image`, `before` and `after` paths in the config. Until then, coloured placeholders are shown.
4. Export a static site to upload to any host (needs Node.js):

```bash
node tools/export-site.js <client>
```

   The result is in `dist/<client>/`, with all text in the HTML for search engines.

To use real footage in the opening, export a short clip as numbered JPGs and set
`film.sequence` in the config (see the comment in `detailing.js`). Without it, the opening
uses moving light in the brand colour. Set `quote.endpoint` to a form service URL to
receive quote requests directly; left empty, the form opens the visitor's email app.

## Publish for free

Any static host works. Two options:

- **GitHub Pages:** repository Settings, Pages, deploy from branch, root folder.
  Free for public repositories.
- **Cloudflare Pages or Netlify:** connect the repository, no build command, output
  folder `/`. Free, and works with private repositories.

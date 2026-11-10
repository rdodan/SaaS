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
- Your list, stages and notes live in your browser only. Use **Backup** regularly and
  **Restore** to move to another browser or computer.
- The page is hidden from search engines but is not password protected. It contains
  no data of its own, so anyone opening it sees an empty tool.
- The public OpenStreetMap servers are shared and rate limited. If a search says the
  server is busy, wait a minute or use a smaller radius.

## Publish for free

Any static host works. Two options:

- **GitHub Pages:** repository Settings, Pages, deploy from branch, root folder.
  Free for public repositories.
- **Cloudflare Pages or Netlify:** connect the repository, no build command, output
  folder `/`. Free, and works with private repositories.

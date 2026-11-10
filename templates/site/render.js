// Turns a site config (see ../sites/*.js) into the page markup.
// Runs in the browser for previews and in Node for the static export.
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.SiteRender = api;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const esc = (value) =>
    String(value == null ? "" : value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const digits = (phone) => String(phone || "").replace(/[^\d+]/g, "");
  const list = (items, fn) => (items || []).map(fn).join("");

  // Only http(s) links and relative paths from the config are allowed into href/src.
  const url = (value) => {
    const text = String(value || "").trim();
    if (/^https?:\/\//i.test(text)) return esc(text);
    if (text && !/^[a-z][a-z0-9+.-]*:/i.test(text) && !text.startsWith("//")) return esc(text);
    return "#";
  };

  const safeColor = (value, fallback) => (/^#[0-9a-f]{3,8}$/i.test(value || "") ? value : fallback);
  const safeFont = (value, fallback) => (/^[\w ]{1,40}$/.test(value || "") ? value : fallback);

  function fontsUrl(site) {
    const t = site.theme || {};
    const families = [safeFont(t.display, ""), safeFont(t.body, "")].filter(Boolean);
    if (!families.length) return "";
    return "https://fonts.googleapis.com/css2?" + families.map((f) => "family=" + f.replace(/ /g, "+") + ":wght@400;500;600;700;800").join("&") + "&display=swap";
  }

  function themeCss(site) {
    const t = site.theme || {};
    const display = safeFont(t.display, "");
    const body = safeFont(t.body, "");
    return (
      ":root{" +
      "--bg:" + safeColor(t.bg, "#0c0c0d") + ";" +
      "--bg2:" + safeColor(t.bg2, "#141416") + ";" +
      "--ink:" + safeColor(t.ink, "#f4f2ee") + ";" +
      "--muted:" + safeColor(t.muted, "#a09d98") + ";" +
      "--line:" + safeColor(t.line, "#2a2a2d") + ";" +
      "--accent:" + safeColor(t.accent, "#f2a900") + ";" +
      "--accent-ink:" + safeColor(t.accentInk, "#111111") + ";" +
      "--film-bg:" + safeColor(t.filmBg, "#08080a") + ";" +
      "--display:" + (display ? '"' + display + '",' : "") + (t.serif ? "Georgia,serif" : '"Arial Narrow","Helvetica Neue",Arial,sans-serif') + ";" +
      "--body:" + (body ? '"' + body + '",' : "") + "system-ui,-apple-system,Segoe UI,Roboto,sans-serif;" +
      "--case:" + (t.uppercase === false ? "none" : "uppercase") + ";" +
      "--tight:" + (t.uppercase === false ? "1.05" : "0.92") + ";" +
      "--radius:" + (/^\d{1,3}px$/.test(t.radius || "") ? t.radius : "999px") + ";" +
      "--card:" + (/^\d{1,2}px$/.test(t.card || "") ? t.card : "18px") + ";" +
      "color-scheme:" + (t.mode === "light" ? "light" : "dark") + "}"
    );
  }

  // A heading given as lines; the last line takes the accent colour.
  function title(tag, kicker, lines, extra) {
    const parts = [].concat(lines || []);
    return (
      (kicker ? `<p class="kicker">${esc(kicker)}</p>` : "") +
      `<${tag} class="title ${extra || ""}">` +
      parts.map((line, i) => `<span class="line${i === parts.length - 1 && parts.length > 1 ? " accent" : ""}">${esc(line)}</span>`).join(" ") +
      `</${tag}>`
    );
  }

  function logo(b) {
    const parts = [].concat(b.logo || b.name);
    return `<span class="logo">${esc(parts[0])}${parts[1] ? `<b>${esc(parts[1])}</b>` : ""}</span>`;
  }

  const NAV = { services: "Services", menu: "Menu", plans: "Membership", timetable: "Classes", process: "Process", work: "Gallery", team: "Team", areas: "Areas", hours: "Visit", faq: "FAQ" };
  const ORDER = ["beforeAfter", "services", "menu", "plans", "timetable", "process", "work", "team", "areas", "hours", "faq", "quote"];
  const order = (site) => (site.order || ORDER).filter((key) => site[key]);
  const heroStyle = (site) => ["film", "split", "poster", "bold"].find((x) => x === (site.hero && site.hero.style)) || "film";

  function header(site) {
    const b = site.business;
    const links = order(site).filter((key) => NAV[key]).slice(0, 6);
    return `
<a class="skip" href="#main">Skip to content</a>
<header class="bar${heroStyle(site) === "split" ? "" : " over-dark"}">
  <a class="bar-logo" href="#top" aria-label="${esc(b.name)} home">${logo(b)}</a>
  <nav aria-label="Main">${list(links, (key) => `<a href="#${key}">${esc((site[key].nav) || NAV[key])}</a>`)}</nav>
  <div class="bar-cta">
    ${b.phone ? `<a class="phone" data-phone href="tel:${esc(digits(b.phone))}">${esc(b.phone)}</a>` : ""}
    <a class="btn" href="#quote">${esc((site.quote && site.quote.cta) || "Get a quote")}</a>
  </div>
</header>`;
  }

  // ---------- openings ----------

  const art = (src, alt) => (src ? `<img src="${url(src)}" alt="${esc(alt || "")}">` : `<div class="ph" aria-hidden="true"></div>`);

  function heroTitle(hero, b, outline) {
    const lines = [].concat(hero.lines || hero.title || b.name);
    return `<h1 class="title">${hero.lines && hero.title ? `<span class="kicker">${esc(hero.title)}</span>` : ""}${lines
      .map((line, i) => `<span class="line${outline && i % 2 ? " outline" : i === lines.length - 1 && lines.length > 1 ? " accent" : ""}">${esc(line)}</span>`)
      .join(" ")}</h1>`;
  }

  function heroCtas(site) {
    const b = site.business;
    const hero = site.hero || {};
    return `<div class="hero-ctas">
      <a class="btn large" href="#quote">${esc(hero.cta || "Get a quote")}</a>
      ${b.phone ? `<a class="btn large ghost" data-phone href="tel:${esc(digits(b.phone))}">${esc(hero.phoneLabel || "Call")} ${esc(b.phone)}</a>` : ""}
    </div>`;
  }

  function marquee(items) {
    if (!items || !items.length) return "";
    return `<div class="marquee" aria-hidden="true"><div class="marquee-track">${list(items, (x) => `<span>${esc(x)}</span>`)}</div></div>`;
  }

  // Side-by-side opening: words on one side, a picture and a small card on the other.
  function heroSplit(site) {
    const b = site.business;
    const hero = site.hero || {};
    const card = site.hours
      ? `<div class="float-card"><p class="open-badge" data-open-badge>Opening hours</p><p data-open-today></p></div>`
      : hero.card ? `<div class="float-card"><p class="open-badge on">${esc(hero.card.title)}</p><p>${esc(hero.card.text)}</p></div>` : "";
    return `
<section id="top" class="hero-split${hero.flip ? " flip" : ""}">
  <div class="hs-copy lines reveal">
    ${heroTitle(hero, b)}
    ${hero.text ? `<p class="lede">${esc(hero.text)}</p>` : ""}
    ${heroCtas(site)}
    ${hero.points ? `<ul class="points">${list(hero.points, (x) => `<li>${esc(x)}</li>`)}</ul>` : ""}
  </div>
  <div class="hs-visual reveal"><div class="hs-frame" data-parallax>${art(hero.image, b.name)}</div>${card}</div>
</section>${marquee(hero.marquee)}`;
  }

  // Full-screen opening with a centred headline over a picture.
  function heroPoster(site) {
    const b = site.business;
    const hero = site.hero || {};
    return `
<section id="top" class="hero-poster">
  <div class="hp-bg" data-parallax>${art(hero.image, "")}</div>
  <div class="hp-inner lines reveal">
    ${b.tagline ? `<p class="hp-tag">${esc(b.tagline)}</p>` : ""}
    ${heroTitle(hero, b)}
    ${hero.text ? `<p class="lede">${esc(hero.text)}</p>` : ""}
    ${heroCtas(site)}
  </div>
  <p class="scroll-cue"><span>Scroll</span><i aria-hidden="true"></i></p>
</section>${marquee(hero.marquee)}`;
  }

  // Loud opening: stacked solid and outlined type, a moving stripe and a row of figures.
  function heroBold(site) {
    const b = site.business;
    const hero = site.hero || {};
    return `
<section id="top" class="hero-bold">
  <div class="hb-stripe" aria-hidden="true"></div>
  <div class="hb-inner lines reveal">
    ${heroTitle(hero, b, true)}
    ${hero.text ? `<p class="lede">${esc(hero.text)}</p>` : ""}
    ${heroCtas(site)}
  </div>
  ${hero.stats ? `<dl class="hb-stats reveal">${list(hero.stats, (x) => `<div><dt>${esc(x.value)}</dt><dd>${esc(x.label)}</dd></div>`)}</dl>` : ""}
</section>${marquee(hero.marquee)}`;
  }

  function film(site) {
    const b = site.business;
    const f = site.film || {};
    const hero = site.hero || {};
    const chapters = f.chapters || [];
    const seq = f.sequence;
    return `
<section id="top" class="film" style="--slides:${chapters.length + 2}" ${seq ? `data-seq-path="${url(seq.path)}" data-seq-count="${Number(seq.count) || 0}" data-seq-pad="${Number(seq.pad) || 0}"` : ""}>
  <div class="film-stage">
    <canvas class="film-canvas" aria-hidden="true"></canvas>
    ${list(chapters, (c, i) => (c.image ? `<img class="film-img" data-slide="${i + 1}" src="${url(c.image)}" alt="" loading="lazy">` : ""))}
    <div class="film-shade" aria-hidden="true"></div>
    <div class="slide slide-intro" data-slide="0">
      <div class="intro-logo">${logo(b)}</div>
      ${b.tagline ? `<p class="intro-tag">${esc(b.tagline)}</p>` : ""}
      <p class="scroll-cue"><span>Scroll</span><i aria-hidden="true"></i></p>
    </div>
    ${list(chapters, (c, i) => `
    <div class="slide" data-slide="${i + 1}">
      <p class="slide-title">${esc(c.title)}</p>
      ${c.text ? `<p class="slide-text">${esc(c.text)}</p>` : ""}
      ${c.source ? `<p class="slide-source">${esc(c.source)}</p>` : ""}
    </div>`)}
    <div class="slide slide-hero" data-slide="${chapters.length + 1}">
      <div class="hero-card">
        ${logo(b)}
        <h1>${esc(hero.title || b.name)}</h1>
        <a class="btn big" href="#quote">${esc(hero.cta || "Book now")}</a>
        ${b.phone ? `<a class="btn big ghost" data-phone href="tel:${esc(digits(b.phone))}">Call or text ${esc(b.phone)}</a>` : ""}
      </div>
    </div>
    ${f.note ? `<p class="film-note">${esc(f.note)}</p>` : ""}
    <a class="film-skip" href="#after-film">Skip intro</a>
  </div>
</section>
<div id="after-film"></div>${marquee((site.hero || {}).marquee)}`;
  }

  function beforeAfter(s) {
    if (!s) return "";
    const pane = (kind, src) =>
      src ? `<img src="${url(src)}" alt="${kind === "before" ? "Before" : "After"}" loading="lazy">` : `<div class="ba-fake ${kind}" role="img" aria-label="${kind === "before" ? "Before" : "After"} (placeholder)"></div>`;
    return `
<section class="sec" id="results">
  <div class="sec-head reveal">${title("h2", s.kicker, s.title)}${s.text ? `<p class="lede">${esc(s.text)}</p>` : ""}</div>
  <div class="ba reveal" style="--pos:50%">
    <div class="ba-after">${pane("after", s.after)}<span class="ba-tag right">After</span></div>
    <div class="ba-before">${pane("before", s.before)}<span class="ba-tag">Before</span></div>
    <div class="ba-handle" aria-hidden="true"><i></i></div>
    <input class="ba-range" type="range" min="0" max="100" value="50" aria-label="Drag to compare before and after">
  </div>
</section>`;
  }

  function services(s, site) {
    if (!s) return "";
    const b = site.business;
    const head = `<div class="sec-head reveal">${title("h2", s.kicker, s.title)}${s.text ? `<p class="lede">${esc(s.text)}</p>` : ""}</div>`;

    // A simple price list: name, dotted line, price.
    if (s.layout === "list") {
      return `
<section class="sec" id="services">
  <div class="split-2">${head}
  <ul class="pricelist reveal">
    ${list(s.items, (item) => `<li><div class="pl-top"><h3>${esc(item.name)}</h3><i></i><span>${esc(item.price || "")}</span></div>${item.text ? `<p>${esc(item.text)}</p>` : ""}</li>`)}
  </ul></div>
</section>`;
    }

    // A grid of cards, one per service.
    if (s.layout === "cards") {
      return `
<section class="sec" id="services">
  ${head}
  <div class="svc-grid">
    ${list(s.items, (item, i) => `
    <article class="svc reveal" style="--i:${i}">
      <span class="svc-n">${String(i + 1).padStart(2, "0")}</span>
      <h3>${esc(item.name)}</h3>
      <p>${esc(item.text)}</p>
      ${list(item.groups, (g) => `<ul>${list(g.items, (x) => `<li>${esc(x)}</li>`)}</ul>`)}
      <a class="svc-link" href="#quote" data-pick="${esc(item.name)}">Get a quote <span aria-hidden="true">&rarr;</span></a>
    </article>`)}
  </div>
</section>`;
    }

    return `
<section class="sec" id="services">
  ${head}
  ${list(s.items, (item, i) => `
  <article class="pack reveal">
    <div class="pack-main">
      <p class="kicker">Option ${i + 1}</p>
      <h3>${esc(item.name)}</h3>
      <p class="lede">${esc(item.text)}</p>
      ${item.price ? `<p class="price">${esc(item.price)}</p>` : ""}
      <div class="pack-actions">
        <a class="btn" href="#quote" data-pick="${esc(item.name)}">Get a quote</a>
        ${b.phone ? `<a class="btn ghost" href="sms:${esc(digits(b.phone))}">Text us</a>` : ""}
      </div>
    </div>
    <div class="pack-lists">
      ${list(item.groups, (g) => `<div><h4>${esc(g.label)}</h4><ul>${list(g.items, (x) => `<li>${esc(x)}</li>`)}</ul></div>`)}
      ${item.steps && item.steps.length ? `
      <details class="acc wide"><summary>What happens, in order</summary>
        <ol>${list(item.steps, (x) => `<li>${esc(x)}</li>`)}</ol>
      </details>` : ""}
    </div>
  </article>`)}
</section>`;
  }

  // ---------- menu, plans, timetable, team, hours ----------

  const DIET = { v: "Vegetarian", vg: "Vegan", gf: "Gluten free", s: "Spicy" };

  function tabs(id, groups, panel) {
    return `
  <div class="tabs reveal" data-tabs="${id}">
    <div class="tab-list" role="tablist">${list(groups, (g, i) => `<button type="button" role="tab" data-tab="${i}" aria-selected="${i === 0}">${esc(g.name || g.day)}</button>`)}</div>
    ${list(groups, (g, i) => `<div class="tab-panel" role="tabpanel" data-panel="${i}" data-name="${esc(g.name || g.day)}"><h3 class="tab-title">${esc(g.name || g.day)}</h3>${panel(g)}</div>`)}
  </div>`;
  }

  function menu(s) {
    if (!s) return "";
    const used = Object.keys(DIET).filter((tag) => s.categories.some((c) => c.items.some((item) => (item.tags || []).includes(tag))));
    return `
<section class="sec" id="menu">
  <div class="sec-head split reveal">
    <div>${title("h2", s.kicker, s.title)}${s.text ? `<p class="lede">${esc(s.text)}</p>` : ""}</div>
    ${used.length ? `<div class="chips diet" role="group" aria-label="Show dishes that are">${list(used, (tag) => `<button type="button" class="btn ghost" data-diet="${tag}" aria-pressed="false">${DIET[tag]}</button>`)}</div>` : ""}
  </div>
  ${tabs("menu", s.categories, (c) => `
    ${c.note ? `<p class="tab-note">${esc(c.note)}</p>` : ""}
    <ul class="dishes">
      ${list(c.items, (item) => `
      <li data-tags="${esc((item.tags || []).join(" "))}">
        <div class="pl-top"><h4>${esc(item.name)}</h4><i></i><span>${esc(item.price || "")}</span></div>
        ${item.text ? `<p>${esc(item.text)}</p>` : ""}
        ${(item.tags || []).length ? `<p class="tags">${list(item.tags, (tag) => (DIET[tag] ? `<span>${DIET[tag]}</span>` : ""))}</p>` : ""}
      </li>`)}
    </ul>`)}
  ${s.note ? `<p class="fineprint reveal">${esc(s.note)}</p>` : ""}
</section>`;
  }

  function plans(s) {
    if (!s) return "";
    return `
<section class="sec alt" id="plans">
  <div class="sec-head reveal">${title("h2", s.kicker, s.title)}${s.text ? `<p class="lede">${esc(s.text)}</p>` : ""}</div>
  <div class="plans">
    ${list(s.items, (p, i) => `
    <article class="plan reveal${p.featured ? " featured" : ""}" style="--i:${i}">
      ${p.featured ? `<span class="badge">${esc(p.badge || "Most popular")}</span>` : ""}
      <h3>${esc(p.name)}</h3>
      <p class="plan-price">${esc(p.price)}<small>${esc(p.per || "")}</small></p>
      ${p.text ? `<p class="plan-text">${esc(p.text)}</p>` : ""}
      <ul>${list(p.features, (x) => `<li>${esc(x)}</li>`)}</ul>
      <a class="btn${p.featured ? "" : " ghost"}" href="#quote" data-pick="${esc(p.name)}">${esc(s.cta || "Choose")}</a>
    </article>`)}
  </div>
  ${s.note ? `<p class="fineprint reveal">${esc(s.note)}</p>` : ""}
</section>`;
  }

  function timetable(s) {
    if (!s) return "";
    return `
<section class="sec" id="timetable">
  <div class="sec-head reveal">${title("h2", s.kicker, s.title)}${s.text ? `<p class="lede">${esc(s.text)}</p>` : ""}</div>
  ${tabs("days", s.days, (d) => `
    <ul class="classes">
      ${list(d.classes, (c) => `<li><span class="c-time">${esc(c.time)}</span><span class="c-name">${esc(c.name)}</span><span class="c-meta">${esc([c.length, c.coach].filter(Boolean).join(" · "))}</span></li>`)}
    </ul>`)}
</section>`;
  }

  function team(s) {
    if (!s) return "";
    return `
<section class="sec alt" id="team">
  <div class="sec-head reveal">${title("h2", s.kicker, s.title)}</div>
  <div class="team">
    ${list(s.people, (p, i) => `
    <figure class="reveal" style="--i:${i}">
      ${p.image ? `<img src="${url(p.image)}" alt="${esc(p.name)}" loading="lazy">` : `<div class="ph avatar" aria-hidden="true">${esc(p.name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2))}</div>`}
      <figcaption><b>${esc(p.name)}</b><span>${esc(p.role)}</span></figcaption>
    </figure>`)}
  </div>
</section>`;
  }

  function hours(s, site) {
    if (!s) return "";
    const b = site.business;
    return `
<section class="sec alt" id="hours">
  <div class="split-2">
    <div class="sec-head reveal">
      ${title("h2", s.kicker, s.title)}
      <p class="open-badge" data-open-badge>Opening hours</p>
      ${b.address ? `<p class="lede">${esc(b.address)}</p>` : ""}
      <div class="pack-actions">
        ${b.mapsUrl ? `<a class="btn" href="${url(b.mapsUrl)}" target="_blank" rel="noopener">Directions</a>` : ""}
        ${b.phone ? `<a class="btn ghost" data-phone href="tel:${esc(digits(b.phone))}">${esc(b.phone)}</a>` : ""}
      </div>
    </div>
    <table class="hours reveal">
      <tbody>
        ${list(s.days, (d, i) => `<tr data-day="${i}"><th scope="row">${esc(d.day)}</th><td>${d.closed ? "Closed" : esc(d.open) + " to " + esc(d.close)}</td></tr>`)}
      </tbody>
      ${s.note ? `<caption>${esc(s.note)}</caption>` : ""}
    </table>
  </div>
</section>`;
  }

  function process(s) {
    if (!s) return "";
    return `
<section class="sec alt" id="process">
  <div class="sec-head reveal">${title("h2", s.kicker, s.title)}</div>
  <ol class="steps">
    ${list(s.steps, (step, i) => `<li class="reveal"><span class="num">${String(i + 1).padStart(2, "0")}</span><h3>${esc(step.title)}</h3><p>${esc(step.text)}</p></li>`)}
  </ol>
</section>`;
  }

  function work(s, site) {
    if (!s) return "";
    const b = site.business;
    return `
<section class="sec" id="work">
  <div class="sec-head split reveal">
    <div>${title("h2", s.kicker, s.title)}${s.text ? `<p class="lede">${esc(s.text)}</p>` : ""}</div>
    <div class="chips">
      ${b.reviewsUrl ? `<a class="btn ghost" href="${url(b.reviewsUrl)}" target="_blank" rel="noopener">&#9733; Read our reviews</a>` : ""}
      ${b.instagramUrl ? `<a class="btn ghost" href="${url(b.instagramUrl)}" target="_blank" rel="noopener">More on Instagram</a>` : ""}
    </div>
  </div>
  <div class="gallery">
    ${list(s.items, (item, i) => `
    <figure class="reveal" style="--i:${i}">
      ${item.image ? `<img src="${url(item.image)}" alt="${esc(item.title)}" loading="lazy">` : `<div class="ph" aria-hidden="true"></div>`}
      <figcaption><span>${esc(item.tag)}</span>${esc(item.title)}</figcaption>
    </figure>`)}
  </div>
</section>`;
  }

  function areas(s, site) {
    if (!s) return "";
    const b = site.business;
    return `
<section class="sec alt" id="areas">
  <div class="sec-head split reveal">
    <div>${title("h2", s.kicker, s.title)}</div>
    ${s.text ? `<p class="lede">${esc(s.text)}</p>` : ""}
  </div>
  <div class="areas">
    <div class="town-check reveal">
      <h3><label for="town">Check your town</label></h3>
      <input id="town" type="search" placeholder="Type your town" autocomplete="off">
      <p id="town-result" role="status"></p>
    </div>
    <div class="area-groups reveal">
      ${list(s.groups, (g) => `
      <details class="acc">
        <summary><span class="area-name">${esc(g.name)}</span><span class="count">${g.towns.length} towns</span></summary>
        ${g.blurb ? `<p>${esc(g.blurb)}</p>` : ""}
        <p class="towns">${list(g.towns, (t) => `<span>${esc(t)}</span>`)}</p>
      </details>`)}
      <div class="pack-actions">
        <a class="btn" href="#quote">Get a quote</a>
        ${b.mapsUrl ? `<a class="btn ghost" href="${url(b.mapsUrl)}" target="_blank" rel="noopener">Directions</a>` : ""}
      </div>
    </div>
  </div>
</section>`;
  }

  function faq(s) {
    if (!s) return "";
    return `
<section class="sec" id="faq">
  <div class="faq">
    <div class="sec-head reveal">${title("h2", s.kicker, s.title)}</div>
    <div class="reveal">${list(s.items, (item) => `<details class="acc"><summary>${esc(item.q)}</summary><p>${esc(item.a)}</p></details>`)}</div>
  </div>
</section>`;
  }

  function quote(s, site) {
    if (!s) return "";
    const b = site.business;
    const steps = s.steps || [];
    const total = steps.length + 1;
    return `
<section class="sec quote" id="quote">
  <div class="quote-copy reveal">
    ${title("h2", s.kicker, s.title)}
    ${s.text ? `<p class="lede">${esc(s.text)}</p>` : ""}
    ${b.phone ? `<p class="lede">Prefer to talk? <a data-phone href="tel:${esc(digits(b.phone))}">Call or text ${esc(b.phone)}</a></p>` : ""}
  </div>
  <form class="wizard reveal" novalidate>
    <div class="wizard-bar" aria-hidden="true"><i></i></div>
    ${list(steps, (step, i) => `
    <fieldset class="wstep" data-step="${i}" ${i ? "hidden" : ""}>
      <legend><span class="kicker">Step ${i + 1} of ${total}</span>${esc(step.title)}</legend>
      <div class="options">
        ${list(step.options, (opt) => `<label class="opt"><input type="radio" name="${esc(step.name)}" value="${esc(opt)}" required><span>${esc(opt)}</span></label>`)}
      </div>
    </fieldset>`)}
    <fieldset class="wstep" data-step="${steps.length}" ${steps.length ? "hidden" : ""}>
      <legend><span class="kicker">Step ${total} of ${total}</span>Where should we reply?</legend>
      <label>Name<input name="name" autocomplete="name" required></label>
      <label>Phone<input name="phone" type="tel" autocomplete="tel" required></label>
      <label>Email <small>(optional)</small><input name="email" type="email" autocomplete="email"></label>
      <label>Anything we should know? <small>(optional)</small><textarea name="message" rows="3"></textarea></label>
      <label class="hp" aria-hidden="true">Leave empty<input name="botcheck" tabindex="-1" autocomplete="off"></label>
    </fieldset>
    <p class="wizard-msg" role="status"></p>
    <div class="wizard-nav">
      <button type="button" class="btn ghost" data-back hidden>Back</button>
      <button type="button" class="btn" data-next>Next</button>
      <button type="submit" class="btn" data-send hidden>${esc(s.submit || "Send my request")}</button>
    </div>
    <div class="wizard-done" hidden>
      <h3>Thank you.</h3>
      <p>Your request is on its way. We will get back to you shortly.</p>
    </div>
  </form>
</section>`;
  }

  function footer(site) {
    const b = site.business;
    return `
<footer class="foot">
  <div>${logo(b)}<p>${esc(b.address || "")}</p></div>
  <div class="foot-links">
    ${b.phone ? `<a data-phone href="tel:${esc(digits(b.phone))}">${esc(b.phone)}</a>` : ""}
    ${b.email ? `<a href="mailto:${esc(b.email)}">${esc(b.email)}</a>` : ""}
    ${b.mapsUrl ? `<a href="${url(b.mapsUrl)}" target="_blank" rel="noopener">Directions</a>` : ""}
  </div>
  <p class="copy">&copy; <span data-year></span> ${esc(b.name)}</p>
</footer>`;
  }

  function extras(site) {
    const b = site.business;
    const chat = site.chat;
    return `
${chat ? `
<button class="chat-btn" type="button" aria-expanded="false" aria-controls="chat"><i aria-hidden="true"></i>Chat with us</button>
<div class="chat" id="chat" role="dialog" aria-label="Chat" hidden>
  <div class="chat-head">${esc(b.name)}<button type="button" data-chat-close aria-label="Close chat">&times;</button></div>
  <div class="chat-log" aria-live="polite"></div>
  <div class="chat-opts"></div>
</div>` : ""}
${b.phone ? `
<nav class="mbar" aria-label="Quick contact">
  <a href="tel:${esc(digits(b.phone))}">Call</a>
  <a href="sms:${esc(digits(b.phone))}">Text</a>
  <a class="hot" href="#quote">Quote</a>
</nav>` : ""}
<div class="toast" role="status" hidden></div>`;
  }

  function render(site) {
    const t = site.theme || {};
    const pick = (value, allowed) => (allowed.includes(value) ? value : allowed[0]);
    const sections = { beforeAfter, services, menu, plans, timetable, process, work, team, areas, hours, faq, quote };
    const hero = { film, split: heroSplit, poster: heroPoster, bold: heroBold }[heroStyle(site)];
    return (
      `<div class="site open-${heroStyle(site)} header-${pick(t.header, ["bar", "centered", "pill"])} pattern-${pick(t.pattern, ["shine", "stripes", "dots", "grain"])} skin-${pick(t.skin, ["cinema", "magazine", "brutal", "classic", "friendly"])}">` +
      header(site) +
      `<main id="main">` +
      hero(site) +
      order(site).map((key) => sections[key](site[key], site)).join("") +
      `</main>` +
      footer(site) +
      extras(site) +
      `</div>`
    );
  }

  return { render, themeCss, fontsUrl, esc };
});

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

  function header(site) {
    const b = site.business;
    const links = [
      site.services && ["Services", "#services"],
      site.process && ["Process", "#process"],
      site.work && ["Work", "#work"],
      site.areas && ["Areas", "#areas"],
      site.faq && ["FAQ", "#faq"],
    ].filter(Boolean);
    return `
<a class="skip" href="#main">Skip to content</a>
<header class="bar">
  <a href="#top" aria-label="${esc(b.name)} home">${logo(b)}</a>
  <nav aria-label="Main">${list(links, (l) => `<a href="${l[1]}">${l[0]}</a>`)}</nav>
  <div class="bar-cta">
    ${b.phone ? `<a class="phone" data-phone href="tel:${esc(digits(b.phone))}">${esc(b.phone)}</a>` : ""}
    <a class="btn" href="#quote">${esc((site.quote && site.quote.cta) || "Get a quote")}</a>
  </div>
</header>`;
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
      <p class="scroll-cue"><span>Scroll to begin</span><i aria-hidden="true"></i></p>
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
<div id="after-film"></div>`;
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
    return `
<section class="sec" id="services">
  <div class="sec-head reveal">${title("h2", s.kicker, s.title)}</div>
  ${list(s.items, (item, i) => `
  <article class="pack reveal">
    <div class="pack-main">
      <p class="kicker">Package ${String(i + 1).padStart(2, "0")}</p>
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
      <details class="acc wide"><summary>How we do it, step by step</summary>
        <ol>${list(item.steps, (x) => `<li>${esc(x)}</li>`)}</ol>
      </details>` : ""}
    </div>
  </article>`)}
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
      <h3><label for="town">Do we come to your town?</label></h3>
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
      <legend><span class="kicker">Step ${total} of ${total}</span>Last step: how do we reach you?</legend>
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
      <button type="submit" class="btn" data-send hidden>${esc(s.submit || "Request my quote")}</button>
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
    return (
      header(site) +
      `<main id="main">` +
      film(site) +
      beforeAfter(site.beforeAfter) +
      services(site.services, site) +
      process(site.process) +
      work(site.work, site) +
      areas(site.areas, site) +
      faq(site.faq) +
      quote(site.quote, site) +
      `</main>` +
      footer(site) +
      extras(site)
    );
  }

  return { render, themeCss, fontsUrl, esc };
});
